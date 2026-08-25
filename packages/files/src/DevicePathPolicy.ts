import path from "node:path";

const CANONICAL_ROOT = "/storage/emulated/0";

export class DevicePathPolicy {
  normalize(input: string): string {
    if (/\p{Cc}/u.test(input)) {
      throw new Error("Device path contains a control character");
    }

    const aliased = input === "/sdcard" || input.startsWith("/sdcard/")
      ? `${CANONICAL_ROOT}${input.slice("/sdcard".length)}`
      : input;
    const normalized = path.posix.normalize(aliased || CANONICAL_ROOT);

    if (normalized !== CANONICAL_ROOT && !normalized.startsWith(`${CANONICAL_ROOT}/`)) {
      throw new Error("Device path is outside shared storage");
    }

    return normalized;
  }

  root(): string {
    return CANONICAL_ROOT;
  }
}
