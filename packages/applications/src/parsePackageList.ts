import type { ApplicationSource } from "@modcell/contracts";

export interface ParsedPackage { packageName: string; apkPath: string; source: ApplicationSource; }

export function parsePackageList(output: string): ParsedPackage[] {
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).flatMap((line) => {
    if (!line.startsWith("package:")) return [];
    const payload = line.slice("package:".length);
    const separator = payload.lastIndexOf("=");
    if (separator <= 0) return [];
    const apkPath = payload.slice(0, separator);
    const packageName = payload.slice(separator + 1);
    const source: ApplicationSource = apkPath.startsWith("/data/app/") ? "user" : "system";
    return [{ packageName, apkPath, source }];
  });
}
