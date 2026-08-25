import type { AdbClient } from "@modcell/android-bridge";
import type { DeviceDirectoryListing } from "@modcell/contracts";
import { DevicePathPolicy } from "./DevicePathPolicy.js";
import { parseFileListing } from "./parseFileListing.js";

function quote(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

export class FileService {
  constructor(
    private readonly adb: AdbClient,
    private readonly paths = new DevicePathPolicy()
  ) {}

  async list(serial: string, requestedPath?: string): Promise<DeviceDirectoryListing> {
    const devicePath = this.paths.normalize(requestedPath ?? this.paths.root());
    const target = quote(devicePath);
    const command = [
      `for f in ${target}/* ${target}/.[!.]* ${target}/..?*; do`,
      `[ -e \"$f\" ] || continue;`,
      `if [ -d \"$f\" ]; then k=d; else k=f; fi;`,
      `n=\"${"${f##*/}"}\";`,
      `s=$(stat -c %s \"$f\" 2>/dev/null || echo 0);`,
      `m=$(stat -c %Y \"$f\" 2>/dev/null || echo 0);`,
      `printf '%s\\0%s\\0%s\\0%s\\0' \"$k\" \"$n\" \"$s\" \"$m\";`,
      `done`
    ].join(" ");

    const result = await this.adb.shellCommand(serial, command, 15_000);
    if (result.exitCode !== 0) {
      throw new Error(result.stderr.trim() || "Unable to list device directory");
    }

    return { serial, path: devicePath, entries: parseFileListing(devicePath, result.stdout) };
  }

  async remove(serial: string, requestedPath: string): Promise<void> {
    const devicePath = this.paths.normalize(requestedPath);
    if (devicePath === this.paths.root()) throw new Error("Shared storage root cannot be deleted");
    const result = await this.adb.shellCommand(serial, `rm -rf -- ${quote(devicePath)}`, 30_000);
    if (result.exitCode !== 0) throw new Error(result.stderr.trim() || "Unable to delete device path");
  }

  async pull(serial: string, requestedPath: string, localPath: string): Promise<void> {
    const devicePath = this.paths.normalize(requestedPath);
    if (!await this.adb.pull(serial, devicePath, localPath)) throw new Error("Unable to download device file");
  }

  async push(serial: string, localPath: string, requestedDirectory: string, fileName: string): Promise<void> {
    if (/[/\\\p{Cc}]/u.test(fileName) || !fileName.trim()) throw new Error("Invalid file name");
    const directory = this.paths.normalize(requestedDirectory);
    const remotePath = `${directory}/${fileName}`;
    if (!await this.adb.push(serial, localPath, remotePath)) throw new Error("Unable to upload device file");
  }
}
