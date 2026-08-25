import type { AdbClient } from "@modcell/android-bridge";
import type { DeviceDiagnosticsSnapshot, LogcatResponse } from "@modcell/contracts";
import { normalizeLogcatRequest } from "./logcatPolicy.js";
import { parseBattery, parseDfData, parseLoadAverage, parseMeminfo, parseNetwork, parseTemperatures, parseUptime } from "./parsers.js";

export class DiagnosticService {
  constructor(private readonly adb: AdbClient) {}

  async snapshot(serial: string): Promise<DeviceDiagnosticsSnapshot> {
    const [memory, storage, uptime, load, battery, thermals, network] = await Promise.all([
      this.adb.shell(serial, ["cat", "/proc/meminfo"]),
      this.adb.shell(serial, ["df", "-k", "/storage/emulated/0"]),
      this.adb.shell(serial, ["cat", "/proc/uptime"]),
      this.adb.shell(serial, ["cat", "/proc/loadavg"]),
      this.adb.shell(serial, ["dumpsys", "battery"]),
      this.adb.shellCommand(serial, "cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null | head -n 16"),
      this.adb.shell(serial, ["ip", "-o", "addr", "show", "up"])
    ]);
    return {
      serial,
      generatedAt: new Date().toISOString(),
      memory: parseMeminfo(memory.stdout),
      storage: parseDfData(storage.stdout),
      uptimeSeconds: parseUptime(uptime.stdout),
      loadAverage: parseLoadAverage(load.stdout),
      battery: parseBattery(battery.stdout),
      temperaturesC: parseTemperatures(thermals.stdout),
      network: parseNetwork(network.stdout)
    };
  }

  async logcat(serial: string, input: { level?: string; lines?: number }): Promise<LogcatResponse> {
    const request = normalizeLogcatRequest(input);
    const result = await this.adb.shell(serial, ["logcat", "-d", "-v", "threadtime", "-t", String(request.lines), `*:${request.level}`], 20_000);
    if (result.exitCode !== 0) throw new Error(result.stderr.trim() || "logcat failed");
    return { serial, level: request.level, lines: result.stdout.split(/\r?\n/).filter(Boolean) };
  }

  async bugreport(serial: string, localPath: string): Promise<void> {
    const result = await this.adb.bugreport(serial, localPath);
    if (result.exitCode !== 0) throw new Error(result.stderr.trim() || "bugreport failed");
  }
}
