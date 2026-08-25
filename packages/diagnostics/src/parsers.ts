import type { BatteryDiagnostics, NetworkInterfaceDiagnostics } from "@modcell/contracts";

const kb = (value: string | undefined) => Number.parseInt(value ?? "0", 10) * 1024;

export function parseMeminfo(output: string) {
  const values = Object.fromEntries(output.split(/\r?\n/).map((line) => line.match(/^(\w+):\s+(\d+)/)).filter(Boolean).map((match) => [match![1], match![2]]));
  const totalBytes = kb(values.MemTotal);
  const availableBytes = kb(values.MemAvailable);
  return { totalBytes, availableBytes, usedBytes: Math.max(0, totalBytes - availableBytes) };
}

export function parseDfData(output: string) {
  const lines = output.trim().split(/\r?\n/).filter(Boolean);
  const fields = lines.at(-1)?.trim().split(/\s+/) ?? [];
  const totalBytes = kb(fields[1]);
  const usedBytes = kb(fields[2]);
  const availableBytes = kb(fields[3]);
  const usagePercent = Number.parseInt(fields[4]?.replace("%", "") ?? "0", 10);
  return { totalBytes, usedBytes, availableBytes, usagePercent: Number.isFinite(usagePercent) ? usagePercent : 0 };
}

export function parseUptime(output: string): number {
  return Math.max(0, Math.floor(Number.parseFloat(output.trim().split(/\s+/)[0] ?? "0") || 0));
}

export function parseLoadAverage(output: string): [number, number, number] {
  const values = output.trim().split(/\s+/).slice(0, 3).map((value) => Number.parseFloat(value) || 0);
  return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0];
}

export function parseBattery(output: string): BatteryDiagnostics {
  const read = (key: string) => output.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? null;
  const level = Number.parseInt(read("level") ?? "", 10);
  const temperatureRaw = Number.parseInt(read("temperature") ?? "", 10);
  const voltageMv = Number.parseInt(read("voltage") ?? "", 10);
  return {
    level: Number.isFinite(level) ? level : null,
    temperatureC: Number.isFinite(temperatureRaw) ? temperatureRaw / 10 : null,
    voltageMv: Number.isFinite(voltageMv) ? voltageMv : null,
    status: read("status")
  };
}

export function parseTemperatures(output: string): number[] {
  return output.split(/\s+/).map(Number).filter(Number.isFinite).map((value) => value > 1000 ? value / 1000 : value).filter((value) => value >= -20 && value <= 150);
}

export function parseNetwork(output: string): NetworkInterfaceDiagnostics[] {
  return output.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\d+:\s+([^\s]+)\s+inet6?\s+([^\s]+)/);
    return match ? [{ name: match[1]!, address: match[2]! }] : [];
  });
}
