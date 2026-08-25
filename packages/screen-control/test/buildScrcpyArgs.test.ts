import { describe, expect, it } from "vitest";
import { buildScrcpyArgs } from "../src/buildScrcpyArgs.js";

describe("buildScrcpyArgs", () => {
  it("builds a constrained session for one device", () => {
    expect(buildScrcpyArgs({ serial: "ABC123", maxSize: 1600, videoBitRateMbps: 8, stayAwake: true })).toEqual([
      "--serial", "ABC123",
      "--max-size", "1600",
      "--video-bit-rate", "8M",
      "--stay-awake",
      "--window-title", "ModCell · ABC123"
    ]);
  });

  it("clamps unsafe numeric values", () => {
    expect(buildScrcpyArgs({ serial: "ABC123", maxSize: 99999, videoBitRateMbps: 1000 })).toContain("4096");
    expect(buildScrcpyArgs({ serial: "ABC123", maxSize: 100, videoBitRateMbps: 0 })).toContain("1M");
  });

  it("rejects malformed serial values", () => {
    expect(() => buildScrcpyArgs({ serial: "ABC123 --no-video" })).toThrow();
  });
});
