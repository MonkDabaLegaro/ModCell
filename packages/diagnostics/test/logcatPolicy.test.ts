import { describe, expect, it } from "vitest";
import { normalizeLogcatRequest } from "../src/logcatPolicy.js";

describe("normalizeLogcatRequest", () => {
  it("uses safe defaults", () => {
    expect(normalizeLogcatRequest({})).toEqual({ level: "V", lines: 200 });
  });

  it("limits the supported level and line count", () => {
    expect(normalizeLogcatRequest({ level: "E", lines: 5000 })).toEqual({ level: "E", lines: 1000 });
    expect(() => normalizeLogcatRequest({ level: "SHELL" })).toThrow();
  });
});
