import type { DeviceDescriptor } from "@modcell/contracts";
import type { CommandResult, CommandRunner } from "../process/CommandRunner.js";
import { NodeCommandRunner } from "../process/NodeCommandRunner.js";
import { parseAdbDevices } from "./parseDevices.js";

export interface AdbClientOptions {
  adbPath?: string;
  runner?: CommandRunner;
}

export class AdbClient {
  readonly adbPath: string;
  private readonly runner: CommandRunner;

  constructor(options: AdbClientOptions = {}) {
    this.adbPath = options.adbPath ?? process.env.MODCELL_ADB_PATH ?? "adb";
    this.runner = options.runner ?? new NodeCommandRunner();
  }

  async listDevices(): Promise<DeviceDescriptor[]> {
    const result = await this.runner.run(this.adbPath, ["devices", "-l"], { timeoutMs: 5_000 });
    if (result.exitCode !== 0) return [];
    return parseAdbDevices(result.stdout);
  }

  async getProp(serial: string, property: string): Promise<string | null> {
    const result = await this.shell(serial, ["getprop", property], 5_000);
    if (result.exitCode !== 0) return null;
    const value = result.stdout.trim();
    return value || null;
  }

  async shell(serial: string, args: readonly string[], timeoutMs = 10_000): Promise<CommandResult> {
    return await this.runner.run(this.adbPath, ["-s", serial, "shell", ...args], { timeoutMs });
  }

  async shellCommand(serial: string, command: string, timeoutMs = 10_000): Promise<CommandResult> {
    return await this.runner.run(this.adbPath, ["-s", serial, "shell", "sh", "-c", command], { timeoutMs });
  }

  async pull(serial: string, remotePath: string, localPath: string): Promise<boolean> {
    const result = await this.runner.run(this.adbPath, ["-s", serial, "pull", remotePath, localPath], { timeoutMs: 120_000 });
    return result.exitCode === 0;
  }

  async push(serial: string, localPath: string, remotePath: string): Promise<boolean> {
    const result = await this.runner.run(this.adbPath, ["-s", serial, "push", localPath, remotePath], { timeoutMs: 120_000 });
    return result.exitCode === 0;
  }

  async reboot(serial: string): Promise<boolean> {
    const result = await this.runner.run(this.adbPath, ["-s", serial, "reboot"], { timeoutMs: 10_000 });
    return result.exitCode === 0;
  }
}
