import type { AdbClient } from "@modcell/android-bridge";
import type { ApplicationDetails, ApplicationInventory, ApplicationSummary } from "@modcell/contracts";
import { assertPackageName } from "./packagePolicy.js";
import { parsePackageList } from "./parsePackageList.js";

function parsePackageNames(output: string): Set<string> {
  return new Set(output.split(/\r?\n/).map((line) => line.trim().replace(/^package:/, "")).filter(Boolean));
}

function parsePermissions(output: string): string[] {
  const lines = output.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === "requested permissions:");
  if (start < 0) return [];
  const permissions: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (!/^\s{6,}\S/.test(line)) break;
    const value = line.trim();
    if (value) permissions.push(value);
  }
  return permissions;
}

export class ApplicationService {
  constructor(private readonly adb: AdbClient) {}

  async list(serial: string): Promise<ApplicationInventory> {
    const [all, disabled] = await Promise.all([
      this.adb.shell(serial, ["pm", "list", "packages", "-f"], 30_000),
      this.adb.shell(serial, ["pm", "list", "packages", "-d"], 30_000)
    ]);
    if (all.exitCode !== 0) throw new Error(all.stderr.trim() || "Unable to list applications");
    const disabledPackages = disabled.exitCode === 0 ? parsePackageNames(disabled.stdout) : new Set<string>();
    const applications: ApplicationSummary[] = parsePackageList(all.stdout)
      .map((app) => ({ ...app, enabled: !disabledPackages.has(app.packageName) }))
      .sort((a, b) => a.packageName.localeCompare(b.packageName));
    return { serial, applications };
  }

  async details(serial: string, rawPackageName: string): Promise<ApplicationDetails> {
    const packageName = assertPackageName(rawPackageName);
    const inventory = await this.list(serial);
    const app = inventory.applications.find((item) => item.packageName === packageName);
    if (!app) throw new Error("Application is not installed");
    const dump = await this.adb.shell(serial, ["dumpsys", "package", packageName], 20_000);
    return { ...app, permissions: dump.exitCode === 0 ? parsePermissions(dump.stdout) : [] };
  }

  async install(serial: string, localApkPath: string): Promise<void> {
    const result = await this.adb.install(serial, localApkPath);
    if (result.exitCode !== 0 || !/Success/i.test(result.stdout + result.stderr)) throw new Error(result.stderr.trim() || result.stdout.trim() || "APK installation failed");
  }

  async uninstall(serial: string, rawPackageName: string): Promise<void> {
    const app = await this.requireUserApp(serial, rawPackageName);
    const result = await this.adb.shell(serial, ["pm", "uninstall", "--user", "0", app.packageName], 60_000);
    if (result.exitCode !== 0 || !/Success/i.test(result.stdout)) throw new Error(result.stderr.trim() || result.stdout.trim() || "Uninstall failed");
  }

  async setEnabled(serial: string, rawPackageName: string, enabled: boolean): Promise<void> {
    const app = await this.requireUserApp(serial, rawPackageName);
    const result = await this.adb.shell(serial, ["pm", enabled ? "enable" : "disable-user", "--user", "0", app.packageName], 20_000);
    if (result.exitCode !== 0) throw new Error(result.stderr.trim() || "Application state change failed");
  }

  async clearData(serial: string, rawPackageName: string): Promise<void> {
    const app = await this.requireUserApp(serial, rawPackageName);
    const result = await this.adb.shell(serial, ["pm", "clear", app.packageName], 30_000);
    if (result.exitCode !== 0 || !/Success/i.test(result.stdout)) throw new Error(result.stderr.trim() || result.stdout.trim() || "Clear data failed");
  }

  private async requireUserApp(serial: string, rawPackageName: string): Promise<ApplicationSummary> {
    const packageName = assertPackageName(rawPackageName);
    const inventory = await this.list(serial);
    const app = inventory.applications.find((item) => item.packageName === packageName);
    if (!app) throw new Error("Application is not installed");
    if (app.source !== "user") throw new Error("System packages are read-only in standard mode");
    return app;
  }
}
