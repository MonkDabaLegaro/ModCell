import { describe, expect, it } from "vitest";
import { parseDfData, parseMeminfo, parseUptime } from "../src/parsers.js";

describe("diagnostic parsers", () => {
  it("parses Android meminfo in bytes", () => {
    const result = parseMeminfo("MemTotal: 8000000 kB\nMemAvailable: 3000000 kB\n");
    expect(result).toEqual({ totalBytes: 8192000000, availableBytes: 3072000000, usedBytes: 5120000000 });
  });

  it("parses shared storage df output", () => {
    const result = parseDfData("Filesystem 1K-blocks Used Available Use% Mounted on\n/dev/fuse 100000 40000 60000 40% /storage/emulated\n");
    expect(result).toEqual({ totalBytes: 102400000, usedBytes: 40960000, availableBytes: 61440000, usagePercent: 40 });
  });

  it("parses uptime seconds", () => {
    expect(parseUptime("12345.67 54321.00")).toBe(12345);
  });
});
