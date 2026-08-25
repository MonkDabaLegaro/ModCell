import path from "node:path";
import type { DeviceFileEntry } from "@modcell/contracts";

export function parseFileListing(parent: string, output: string): DeviceFileEntry[] {
  const parts = output.split("\0");
  const entries: DeviceFileEntry[] = [];

  for (let index = 0; index + 3 < parts.length; index += 4) {
    const [rawKind, name, rawSize, rawModified] = parts.slice(index, index + 4);
    if (!rawKind || !name) continue;

    const modifiedSeconds = Number.parseFloat(rawModified ?? "");
    entries.push({
      name,
      path: path.posix.join(parent, name),
      kind: rawKind === "d" ? "directory" : "file",
      size: Number.parseInt(rawSize ?? "0", 10) || 0,
      modifiedAt: Number.isFinite(modifiedSeconds)
        ? new Date(modifiedSeconds * 1000).toISOString()
        : null
    });
  }

  return entries.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}
