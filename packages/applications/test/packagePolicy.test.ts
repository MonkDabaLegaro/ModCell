import { describe, expect, it } from "vitest";
import { assertPackageName } from "../src/packagePolicy.js";

describe("assertPackageName", () => {
  it("accepts normal Android package identifiers", () => {
    expect(assertPackageName("com.example.app")).toBe("com.example.app");
  });

  it("rejects shell-like or malformed values", () => {
    expect(() => assertPackageName("com.example.app;reboot")).toThrow();
    expect(() => assertPackageName("../system")).toThrow();
    expect(() => assertPackageName("-S")).toThrow();
  });
});
