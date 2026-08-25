import { createHash } from "node:crypto";
import { access, chmod, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, extname, join } from "node:path";
import extractZip from "extract-zip";
import * as tar from "tar";
import { SCRCPY_VERSION, selectScrcpyAsset } from "./scrcpyCatalog.js";

export type ToolSource = "environment" | "path" | "managed" | "unavailable";
export interface ToolResolution {
  name: "scrcpy";
  version: string;
  source: ToolSource;
  executablePath: string | null;
  managed: boolean;
  detail?: string;
}

export interface ToolchainManagerOptions {
  cacheDir?: string;
  platform?: NodeJS.Platform;
  arch?: NodeJS.Architecture;
  env?: NodeJS.ProcessEnv;
}

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

async function findExecutable(root: string, name: string): Promise<string | null> {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(root, entry.name);
    if (entry.isFile() && entry.name === name) return full;
    if (entry.isDirectory()) {
      const found = await findExecutable(full, name);
      if (found) return found;
    }
  }
  return null;
}

export class ToolchainManager {
  readonly cacheDir: string;
  readonly platform: NodeJS.Platform;
  readonly arch: NodeJS.Architecture;
  private readonly env: NodeJS.ProcessEnv;

  constructor(options: ToolchainManagerOptions = {}) {
    this.cacheDir = options.cacheDir ?? join(homedir(), ".modcell", "tools");
    this.platform = options.platform ?? process.platform;
    this.arch = options.arch ?? process.arch;
    this.env = options.env ?? process.env;
  }

  async resolveScrcpy(): Promise<ToolResolution> {
    const configured = this.env.MODCELL_SCRCPY_PATH;
    if (configured && await exists(configured)) return { name: "scrcpy", version: SCRCPY_VERSION, source: "environment", executablePath: configured, managed: false };

    const fromPath = await this.findOnPath(this.platform === "win32" ? "scrcpy.exe" : "scrcpy");
    if (fromPath) return { name: "scrcpy", version: SCRCPY_VERSION, source: "path", executablePath: fromPath, managed: false };

    const managed = await this.managedExecutable();
    if (managed) return { name: "scrcpy", version: SCRCPY_VERSION, source: "managed", executablePath: managed, managed: true };

    const asset = selectScrcpyAsset(this.platform, this.arch);
    return {
      name: "scrcpy", version: SCRCPY_VERSION, source: "unavailable", executablePath: null, managed: false,
      detail: asset ? "Official managed artifact is available but not installed" : `No managed scrcpy artifact for ${this.platform}/${this.arch}`
    };
  }

  async ensureScrcpy(): Promise<ToolResolution> {
    const existing = await this.resolveScrcpy();
    if (existing.executablePath) return existing;
    const asset = selectScrcpyAsset(this.platform, this.arch);
    if (!asset) return existing;

    const targetDir = this.managedDir();
    const archivePath = join(targetDir, asset.fileName);
    await rm(targetDir, { recursive: true, force: true });
    await mkdir(targetDir, { recursive: true });

    const response = await fetch(asset.url);
    if (!response.ok) throw new Error(`Failed to download scrcpy (${response.status})`);
    const bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(archivePath, bytes);
    const digest = createHash("sha256").update(bytes).digest("hex");
    if (digest !== asset.sha256) {
      await rm(targetDir, { recursive: true, force: true });
      throw new Error("scrcpy checksum verification failed");
    }

    if (asset.archive === "zip") await extractZip(archivePath, { dir: targetDir });
    else await tar.x({ file: archivePath, cwd: targetDir, gzip: true });
    await rm(archivePath, { force: true });

    const executable = await findExecutable(targetDir, asset.executableName);
    if (!executable) throw new Error("scrcpy executable missing after extraction");
    if (this.platform !== "win32") await chmod(executable, 0o755);
    return { name: "scrcpy", version: SCRCPY_VERSION, source: "managed", executablePath: executable, managed: true };
  }

  private managedDir(): string { return join(this.cacheDir, "scrcpy", SCRCPY_VERSION, `${this.platform}-${this.arch}`); }
  private async managedExecutable(): Promise<string | null> {
    const asset = selectScrcpyAsset(this.platform, this.arch);
    if (!asset || !await exists(this.managedDir())) return null;
    return await findExecutable(this.managedDir(), asset.executableName);
  }

  private async findOnPath(name: string): Promise<string | null> {
    const pathValue = this.env.PATH ?? this.env.Path ?? this.env.path;
    if (!pathValue) return null;
    for (const segment of pathValue.split(this.platform === "win32" ? ";" : ":")) {
      if (!segment) continue;
      const candidate = join(segment, name);
      if (await exists(candidate)) return candidate;
    }
    return null;
  }
}
