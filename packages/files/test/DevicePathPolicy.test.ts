import { describe, expect, it } from "vitest";
import { DevicePathPolicy } from "../src/DevicePathPolicy.js";

describe("DevicePathPolicy", () => {
  const policy = new DevicePathPolicy();

  it("normalizes shared-storage aliases to the canonical root", () => {
    expect(policy.normalize("/sdcard/DCIM/../Pictures")).toBe("/storage/emulated/0/Pictures");
  });

  it("rejects paths outside shared storage", () => {
    expect(() => policy.normalize("/data/data/com.example"))
      .toThrowError(/outside shared storage/i);
  });

  it("rejects control characters", () => {
    expect(() => policy.normalize("/sdcard/Download/bad\nname.txt"))
      .toThrowError(/control character/i);
  });
});
