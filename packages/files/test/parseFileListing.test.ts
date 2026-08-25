import { describe, expect, it } from "vitest";
import { parseFileListing } from "../src/parseFileListing.js";

describe("parseFileListing", () => {
  it("parses null-delimited metadata without breaking spaces in names", () => {
    const output = [
      "d", "DCIM", "0", "1710000000",
      "f", "holiday photo.jpg", "2048", "1710000001",
      ""
    ].join("\0");

    expect(parseFileListing("/storage/emulated/0", output)).toEqual([
      {
        name: "DCIM",
        path: "/storage/emulated/0/DCIM",
        kind: "directory",
        size: 0,
        modifiedAt: "2024-03-09T16:00:00.000Z"
      },
      {
        name: "holiday photo.jpg",
        path: "/storage/emulated/0/holiday photo.jpg",
        kind: "file",
        size: 2048,
        modifiedAt: "2024-03-09T16:00:01.000Z"
      }
    ]);
  });
});
