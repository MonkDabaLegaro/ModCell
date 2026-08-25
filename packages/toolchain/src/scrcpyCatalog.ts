export const SCRCPY_VERSION = "4.1" as const;
const BASE_URL = `https://github.com/Genymobile/scrcpy/releases/download/v${SCRCPY_VERSION}`;

export interface ScrcpyAsset {
  platform: NodeJS.Platform;
  arch: NodeJS.Architecture;
  fileName: string;
  sha256: string;
  archive: "zip" | "tar.gz";
  executableName: string;
  url: string;
}

const ASSETS: readonly ScrcpyAsset[] = [
  {
    platform: "win32",
    arch: "x64",
    fileName: "scrcpy-win64-v4.1.zip",
    sha256: "5b12172b3264b2889f4583ee64752ce832e29bc8b1089dca81093459697165db",
    archive: "zip",
    executableName: "scrcpy.exe",
    url: `${BASE_URL}/scrcpy-win64-v4.1.zip`
  },
  {
    platform: "linux",
    arch: "x64",
    fileName: "scrcpy-linux-x86_64-v4.1.tar.gz",
    sha256: "ad56ae8bfeedf41e824945c11dbf55fcb092b3e615b9b486f48a50e30d389635",
    archive: "tar.gz",
    executableName: "scrcpy",
    url: `${BASE_URL}/scrcpy-linux-x86_64-v4.1.tar.gz`
  },
  {
    platform: "darwin",
    arch: "x64",
    fileName: "scrcpy-macos-x86_64-v4.1.tar.gz",
    sha256: "ee2a7223bc8dbdc4f482db1134bcf441178dafb833492b71ca4c22090c58ce72",
    archive: "tar.gz",
    executableName: "scrcpy",
    url: `${BASE_URL}/scrcpy-macos-x86_64-v4.1.tar.gz`
  },
  {
    platform: "darwin",
    arch: "arm64",
    fileName: "scrcpy-macos-aarch64-v4.1.tar.gz",
    sha256: "20fd47c9014dd5e0fa77091f3cb7adbda8445a360c4584aeaa0150b5b3988ff3",
    archive: "tar.gz",
    executableName: "scrcpy",
    url: `${BASE_URL}/scrcpy-macos-aarch64-v4.1.tar.gz`
  }
] as const;

export function selectScrcpyAsset(platform: NodeJS.Platform, arch: NodeJS.Architecture): ScrcpyAsset | null {
  return ASSETS.find((asset) => asset.platform === platform && asset.arch === arch) ?? null;
}
