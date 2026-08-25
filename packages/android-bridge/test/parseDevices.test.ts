import { describe, expect, it } from "vitest";
import { parseAdbDevices } from "../src/adb/parseDevices.js";

describe("parseAdbDevices", () => {
  it("parses connected and unauthorized devices without shell parsing", () => {
    const output = `List of devices attached\nABC123 device product:husky model:Pixel_8_Pro device:husky transport_id:1\nXYZ999 unauthorized usb:1-2 transport_id:2\n`;

    expect(parseAdbDevices(output)).toEqual([
      {
        serial: "ABC123",
        state: "device",
        product: "husky",
        model: "Pixel 8 Pro",
        device: "husky",
        transportId: "1"
      },
      {
        serial: "XYZ999",
        state: "unauthorized",
        product: undefined,
        model: undefined,
        device: undefined,
        transportId: "2"
      }
    ]);
  });
});
