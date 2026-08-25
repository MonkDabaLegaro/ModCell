import cors from "@fastify/cors";
import { AdbClient } from "@modcell/android-bridge";
import type { HealthResponse } from "@modcell/contracts";
import { DeviceService } from "@modcell/device-domain";
import Fastify from "fastify";

export interface CreateAppOptions {
  adbPath?: string;
}

export async function createApp(options: CreateAppOptions = {}) {
  const app = Fastify({ logger: true });
  const adb = new AdbClient({ adbPath: options.adbPath });
  const devices = new DeviceService(adb);

  await app.register(cors, {
    origin: (origin, callback) => {
      const allowed = !origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      callback(allowed ? null : new Error("Origin not allowed"), allowed);
    }
  });

  app.get("/api/health", async (): Promise<HealthResponse> => ({
    status: "ok",
    service: "modcell-daemon",
    version: "0.1.0"
  }));

  app.get("/api/devices", async () => devices.snapshot());

  app.post<{ Params: { serial: string } }>("/api/devices/:serial/reboot", async (request, reply) => {
    const snapshot = await devices.snapshot();
    const target = snapshot.devices.find((device) => device.serial === request.params.serial);

    if (!target || target.state !== "device") {
      return reply.code(409).send({ ok: false, error: "Device is not connected and authorized" });
    }

    const ok = await adb.reboot(target.serial);
    return reply.code(ok ? 202 : 500).send({ ok });
  });

  return app;
}
