import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { pipeline } from "node:stream/promises";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { AdbClient } from "@modcell/android-bridge";
import type { HealthResponse } from "@modcell/contracts";
import { DeviceService } from "@modcell/device-domain";
import { FileService } from "@modcell/files";
import Fastify from "fastify";

export interface CreateAppOptions { adbPath?: string; }

export async function createApp(options: CreateAppOptions = {}) {
  const app = Fastify({ logger: true });
  const adb = new AdbClient({ adbPath: options.adbPath });
  const devices = new DeviceService(adb);
  const files = new FileService(adb);

  await app.register(cors, {
    origin: (origin, callback) => {
      const allowed = !origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      callback(allowed ? null : new Error("Origin not allowed"), allowed);
    }
  });
  await app.register(multipart, { limits: { fileSize: 1024 * 1024 * 1024, files: 1 } });

  const requireDevice = async (serial: string) => {
    const snapshot = await devices.snapshot();
    const target = snapshot.devices.find((device) => device.serial === serial);
    if (!target || target.state !== "device") throw new Error("Device is not connected and authorized");
  };

  app.get("/api/health", async (): Promise<HealthResponse> => ({ status: "ok", service: "modcell-daemon", version: "0.1.0" }));
  app.get("/api/devices", async () => devices.snapshot());

  app.get<{ Params: { serial: string }; Querystring: { path?: string } }>("/api/devices/:serial/files", async (request, reply) => {
    try {
      await requireDevice(request.params.serial);
      return await files.list(request.params.serial, request.query.path);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : "File listing failed" });
    }
  });

  app.delete<{ Params: { serial: string }; Querystring: { path: string } }>("/api/devices/:serial/files", async (request, reply) => {
    try {
      await requireDevice(request.params.serial);
      await files.remove(request.params.serial, request.query.path);
      return reply.code(204).send();
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : "Delete failed" });
    }
  });

  app.get<{ Params: { serial: string }; Querystring: { path: string } }>("/api/devices/:serial/files/download", async (request, reply) => {
    const dir = await mkdtemp(join(tmpdir(), "modcell-pull-"));
    try {
      await requireDevice(request.params.serial);
      const fileName = basename(request.query.path) || "download";
      const localPath = join(dir, fileName);
      await files.pull(request.params.serial, request.query.path, localPath);
      reply.header("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      return reply.send(createReadStream(localPath).on("close", () => { void rm(dir, { recursive: true, force: true }); }));
    } catch (error) {
      await rm(dir, { recursive: true, force: true });
      return reply.code(400).send({ error: error instanceof Error ? error.message : "Download failed" });
    }
  });

  app.post<{ Params: { serial: string }; Querystring: { path?: string } }>("/api/devices/:serial/files/upload", async (request, reply) => {
    const dir = await mkdtemp(join(tmpdir(), "modcell-push-"));
    try {
      await requireDevice(request.params.serial);
      const part = await request.file();
      if (!part) return reply.code(400).send({ error: "A file is required" });
      const localPath = join(dir, "upload");
      await pipeline(part.file, createWriteStream(localPath));
      await files.push(request.params.serial, localPath, request.query.path ?? "/sdcard", part.filename);
      return reply.code(201).send({ ok: true });
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : "Upload failed" });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  app.post<{ Params: { serial: string } }>("/api/devices/:serial/reboot", async (request, reply) => {
    try {
      await requireDevice(request.params.serial);
      const ok = await adb.reboot(request.params.serial);
      return reply.code(ok ? 202 : 500).send({ ok });
    } catch (error) {
      return reply.code(409).send({ ok: false, error: error instanceof Error ? error.message : "Device unavailable" });
    }
  });

  return app;
}
