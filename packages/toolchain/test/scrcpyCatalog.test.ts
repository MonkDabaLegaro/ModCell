import { describe, expect, it } from "vitest";
import { SCRCPY_VERSION, selectScrcpyAsset } from "../src/scrcpyCatalog.js";

describe("scrcpy catalog", () => {
  it("pins the official scrcpy version", () => {
    expect(SCRCPY_VERSION).toBe("4.1");
  });

  it("selects the official Windows x64 artifact", () => {
    expect(selectScrcpyAsset("win32", "x64")).toMatchObject({
      fileName: "scrcpy-win64-v4.1.zip",
      sha256: "5b12172b3264b2889f4583ee64752ce832e29bc8b1089dca81093459697165db"
    });
  });

  it("selects the official Linux x64 artifact", () => {
    expect(selectScrcpyAsset("linux", "x64")).toMatchObject({
      fileName: "scrcpy-linux-x86_64-v4.1.tar.gz",
      sha256: "ad56ae8bfeedf41e824945c11dbf55fcb092b3e615b9b486f48a50e30d389635"
    });
  });

  it("selects the official Apple Silicon artifact", () => {
    expect(selectScrcpyAsset("darwin", "arm64")).toMatchObject({
      fileName: "scrcpy-macos-aarch64-v4.1.tar.gz",
      sha256: "20fd47c9014dd5e0fa77091f3cb7adbda8445a360c4584aeaa0150b5b3988ff3"
    });
  });

  it("returns null when no official managed artifact exists", () => {
    expect(selectScrcpyAsset("linux", "arm64")).toBeNull();
  });
});
