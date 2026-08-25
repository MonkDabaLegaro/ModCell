import { spawn } from "node:child_process";
import type { CommandOptions, CommandResult, CommandRunner } from "./CommandRunner.js";

export class NodeCommandRunner implements CommandRunner {
  async run(executable: string, args: readonly string[], options: CommandOptions = {}): Promise<CommandResult> {
    const timeoutMs = options.timeoutMs ?? 15_000;

    return await new Promise<CommandResult>((resolve) => {
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let settled = false;

      const child = spawn(executable, [...args], {
        cwd: options.cwd,
        env: options.env,
        windowsHide: true,
        shell: false
      });

      const settle = (result: CommandResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      };

      child.stdout?.setEncoding("utf8");
      child.stderr?.setEncoding("utf8");
      child.stdout?.on("data", (chunk: string) => { stdout += chunk; });
      child.stderr?.on("data", (chunk: string) => { stderr += chunk; });

      child.on("error", (error) => {
        stderr += error.message;
        settle({ stdout, stderr, exitCode: -1, timedOut });
      });

      child.on("close", (code) => {
        settle({ stdout, stderr, exitCode: code ?? -1, timedOut });
      });

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, timeoutMs);
    });
  }
}
