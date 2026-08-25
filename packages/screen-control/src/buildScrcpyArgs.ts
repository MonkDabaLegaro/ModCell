export interface ScreenSessionOptions {
  serial: string;
  maxSize?: number;
  videoBitRateMbps?: number;
  stayAwake?: boolean;
}

function assertSerial(serial: string): string {
  if (!/^[A-Za-z0-9._:-]+$/.test(serial)) throw new Error("Invalid Android serial");
  return serial;
}

function clampInteger(value: number | undefined, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value!)));
}

export function buildScrcpyArgs(options: ScreenSessionOptions): string[] {
  const serial = assertSerial(options.serial);
  const maxSize = clampInteger(options.maxSize, 1600, 320, 4096);
  const bitRate = clampInteger(options.videoBitRateMbps, 8, 1, 64);
  const args = [
    "--serial", serial,
    "--max-size", String(maxSize),
    "--video-bit-rate", `${bitRate}M`
  ];
  if (options.stayAwake) args.push("--stay-awake");
  args.push("--window-title", `ModCell · ${serial}`);
  return args;
}
