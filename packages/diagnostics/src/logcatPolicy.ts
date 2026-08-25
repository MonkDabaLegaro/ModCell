import type { LogcatLevel } from "@modcell/contracts";

const LEVELS = new Set<LogcatLevel>(["V", "D", "I", "W", "E", "F"]);

export function normalizeLogcatRequest(input: { level?: string; lines?: number }) {
  const level = (input.level ?? "V") as LogcatLevel;
  if (!LEVELS.has(level)) throw new Error("Unsupported logcat level");
  const requested = Number.isFinite(input.lines) ? Math.floor(input.lines!) : 200;
  return { level, lines: Math.min(1000, Math.max(50, requested)) };
}
