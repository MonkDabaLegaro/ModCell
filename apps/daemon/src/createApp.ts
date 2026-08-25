import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { pipeline } from "node:stream/promises";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { AdbClient } from "@modcell/android-bridge";
import { ApplicationService } from "@modcell/applications";
import type { HealthResponse } from "@modcell/contracts";
import { DeviceService } from "@modcell/device-domain";
import { DiagnosticService } from "@modcell/diagnostics";
import { FileService } from "@modcell/files";
import Fastify from "fastify";

export interface CreateAppOptions { adbPath?: string; }
export async function createApp(options: CreateAppOptions = {}) {
  const app = Fastify({ logger: true });
  const adb = new AdbClient({ adbPath: options.adbPath });
  const devices = new DeviceService(adb);
  const files = new FileService(adb);
  const applications = new ApplicationService(adb);
  const diagnostics = new DiagnosticService(adb);
  await app.register(cors, { origin: (origin, callback) => { const allowed = !origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin); callback(allowed ? null : new Error("Origin not allowed"), allowed); } });
  await app.register(multipart, { limits: { fileSize: 1024 * 1024 * 1024, files: 1 } });
  const requireDevice = async (serial: string) => { const snapshot = await devices.snapshot(); const target = snapshot.devices.find((device) => device.serial === serial); if (!target || target.state !== "device") throw new Error("Device is not connected and authorized"); };
  const message = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

  app.get("/api/health", async (): Promise<HealthResponse> => ({ status: "ok", service: "modcell-daemon", version: "0.1.0" }));
  app.get("/api/devices", async () => devices.snapshot());

  app.get<{ Params: { serial: string }; Querystring: { path?: string } }>("/api/devices/:serial/files", async (request, reply) => { try { await requireDevice(request.params.serial); return await files.list(request.params.serial, request.query.path); } catch (error) { return reply.code(400).send({ error: message(error, "File listing failed") }); } });
  app.delete<{ Params: { serial: string }; Querystring: { path: string } }>("/api/devices/:serial/files", async (request, reply) => { try { await requireDevice(request.params.serial); await files.remove(request.params.serial, request.query.path); return reply.code(204).send(); } catch (error) { return reply.code(400).send({ error: message(error, "Delete failed") }); } });
  app.get<{ Params: { serial: string }; Querystring: { path: string } }>("/api/devices/:serial/files/download", async (request, reply) => { const dir = await mkdtemp(join(tmpdir(), "modcell-pull-")); try { await requireDevice(request.params.serial); const fileName = basename(request.query.path) || "download"; const localPath = join(dir, fileName); await files.pull(request.params.serial, request.query.path, localPath); reply.header("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`); return reply.send(createReadStream(localPath).on("close", () => { void rm(dir, { recursive: true, force: true }); })); } catch (error) { await rm(dir, { recursive: true, force: true }); return reply.code(400).send({ error: message(error, "Download failed") }); } });
  app.post<{ Params: { serial: string }; Querystring: { path?: string } }>("/api/devices/:serial/files/upload", async (request, reply) => { const dir = await mkdtemp(join(tmpdir(), "modcell-push-")); try { await requireDevice(request.params.serial); const part = await request.file(); if (!part) return reply.code(400).send({ error: "A file is required" }); const localPath = join(dir, "upload"); await pipeline(part.file, createWriteStream(localPath)); await files.push(request.params.serial, localPath, request.query.path ?? "/sdcard", part.filename); return reply.code(201).send({ ok: true }); } catch (error) { return reply.code(400).send({ error: message(error, "Upload failed") }); } finally { await rm(dir, { recursive: true, force: true }); } });

  app.get<{ Params: { serial: string } }>("/api/devices/:serial/applications", async (request, reply) => { try { await requireDevice(request.params.serial); return await applications.list(request.params.serial); } catch (error) { return reply.code(400).send({ error: message(error, "Application inventory failed") }); } });
  app.get<{ Params: { serial: string; packageName: string } }>("/api/devices/:serial/applications/:packageName", async (request, reply) => { try { await requireDevice(request.params.serial); return await applications.details(request.params.serial, request.params.packageName); } catch (error) { return reply.code(400).send({ error: message(error, "Application details failed") }); } });
  app.post<{ Params: { serial: string; packageName: string }; Body: { enabled: boolean } }>("/api/devices/:serial/applications/:packageName/enabled", async (request, reply) => { try { await requireDevice(request.params.serial); await applications.setEnabled(request.params.serial, request.params.packageName, request.body.enabled); return { ok: true }; } catch (error) { return reply.code(400).send({ error: message(error, "Application state change failed") }); } });
  app.post<{ Params: { serial: string; packageName: string } }>("/api/devices/:serial/applications/:packageName/clear-data", async (request, reply) => { try { await requireDevice(request.params.serial); await applications.clearData(request.params.serial, request.params.packageName); return { ok: true }; } catch (error) { return reply.code(400).send({ error: message(error, "Clear data failed") }); } });
  app.delete<{ Params: { serial: string; packageName: string } }>("/api/devices/:serial/applications/:packageName", async (request, reply) => { try { await requireDevice(request.params.serial); await applications.uninstall(request.params.serial, request.params.packageName); return reply.code(204).send(); } catch (error) { return reply.code(400).send({ error: message(error, "Uninstall failed") }); } });
  app.post<{ Params: { serial: string } }>("/api/devices/:serial/applications/install", async (request, reply) => { const dir = await mkdtemp(join(tmpdir(), "modcell-apk-")); try { await requireDevice(request.params.serial); const part = await request.file(); if (!part || !part.filename.toLowerCase().endsWith(".apk")) return reply.code(400).send({ error: "An APK file is required" }); const localPath = join(dir, "application.apk"); await pipeline(part.file, createWriteStream(localPath)); await applications.install(request.params.serial, localPath); return reply.code(201).send({ ok: true }); } catch (error) { return reply.code(400).send({ error: message(error, "APK installation failed") }); } finally { await rm(dir, { recursive: true, force: true }); } });

  app.get<{ Params: { serial: string } }>("/api/devices/:serial/diagnostics", async (request, reply) => { try { await requireDevice(request.params.serial); return await diagnostics.snapshot(request.params.serial); } catch (error) { return reply.code(400).send({ error: message(error, "Diagnostics failed") }); } });
  app.get<{ Params: { serial: string }; Querystring: { level?: string; lines?: number } }>("/api/devices/:serial/diagnostics/logcat", async (request, reply) => { try { await requireDevice(request.params.serial); return await diagnostics.logcat(request.params.serial, request.query); } catch (error) { return reply.code(400).send({ error: message(error, "Logcat failed") }); } });
  app.get<{ Params: { serial: string } }>("/api/devices/:serial/diagnostics/bugreport", async (request, reply) => { const dir = await mkdtemp(join(tmpdir(), "modcell-bugreport-")); try { await requireDevice(request.params.serial); const localPath = join(dir, "modcell-bugreport.zip"); await diagnostics.bugreport(request.params.serial, localPath); reply.header("Content-Disposition", "attachment; filename=modcell-bugreport.zip"); return reply.send(createReadStream(localPath).on("close", () => { void rm(dir, { recursive: true, force: true }); })); } catch (error) { await rm(dir, { recursive: true, force: true }); return reply.code(400).send({ error: message(error, "Bugreport failed") }); } });

  app.post<{ Params: { serial: string } }>("/api/devices/:serial/reboot", async (request, reply) => { try { await requireDevice(request.params.serial); const ok = await adb.reboot(request.params.serial); return reply.code(ok ? 202 : 500).send({ ok }); } catch (error) { return reply.code(409).send({ ok: false, error: message(error, "Device unavailable") }); } });
  return app;
}
