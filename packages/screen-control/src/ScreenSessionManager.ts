import { spawn, type ChildProcess } from "node:child_process";
import type { ToolchainManager } from "@modcell/toolchain";
import { buildScrcpyArgs, type ScreenSessionOptions } from "./buildScrcpyArgs.js";

export interface ScreenSessionStatus {
  serial: string;
  running: boolean;
  pid: number | null;
  startedAt: string | null;
}

interface ActiveSession {
  child: ChildProcess;
  startedAt: string;
}

export interface ScreenSessionManagerOptions {
  adbPath?: string;
}

export class ScreenSessionManager {
  private readonly sessions = new Map<string, ActiveSession>();

  constructor(private readonly toolchain: ToolchainManager, private readonly options: ScreenSessionManagerOptions = {}) {}

  status(serial: string): ScreenSessionStatus {
    const session = this.sessions.get(serial);
    return {
      serial,
      running: Boolean(session && session.child.exitCode === null && !session.child.killed),
      pid: session?.child.pid ?? null,
      startedAt: session?.startedAt ?? null
    };
  }

  async start(options: ScreenSessionOptions): Promise<ScreenSessionStatus> {
    const current = this.status(options.serial);
    if (current.running) return current;

    const tool = await this.toolchain.ensureScrcpy();
    if (!tool.executablePath) throw new Error(tool.detail ?? "scrcpy is unavailable on this platform");

    const child = spawn(tool.executablePath, buildScrcpyArgs(options), {
      shell: false,
      windowsHide: false,
      stdio: "ignore",
      env: this.options.adbPath ? { ...process.env, ADB: this.options.adbPath } : process.env
    });
    const startedAt = new Date().toISOString();
    this.sessions.set(options.serial, { child, startedAt });
    child.once("exit", () => this.sessions.delete(options.serial));
    child.once("error", () => this.sessions.delete(options.serial));
    return this.status(options.serial);
  }

  async stop(serial: string): Promise<ScreenSessionStatus> {
    const session = this.sessions.get(serial);
    if (!session) return this.status(serial);
    session.child.kill();
    this.sessions.delete(serial);
    return this.status(serial);
  }

  async stopAll(): Promise<void> {
    for (const serial of [...this.sessions.keys()]) await this.stop(serial);
  }
}
