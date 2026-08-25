import { describe, expect, it } from "vitest";
import { parsePackageList } from "../src/parsePackageList.js";

describe("parsePackageList", () => {
  it("parses package paths and distinguishes system packages", () => {
    const output = [
      "package:/data/app/~~abc/com.example.user-xyz/base.apk=com.example.user",
      "package:/system/priv-app/Settings/Settings.apk=com.android.settings"
    ].join("\n");

    expect(parsePackageList(output)).toEqual([
      { packageName: "com.example.user", apkPath: "/data/app/~~abc/com.example.user-xyz/base.apk", source: "user" },
      { packageName: "com.android.settings", apkPath: "/system/priv-app/Settings/Settings.apk", source: "system" }
    ]);
  });
});
