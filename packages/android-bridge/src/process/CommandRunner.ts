export interface CommandOptions {
  timeoutMs?: number;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

export interface CommandRunner {
  run(executable: string, args: readonly string[], options?: CommandOptions): Promise<CommandResult>;
}
