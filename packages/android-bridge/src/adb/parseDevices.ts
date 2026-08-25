import type { DeviceConnectionState, DeviceDescriptor } from "@modcell/contracts";

const KNOWN_STATES = new Set<DeviceConnectionState>(["device", "offline", "unauthorized"]);

export function parseAdbDevices(output: string): DeviceDescriptor[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("List of devices attached") && !line.startsWith("* daemon"))
    .map((line) => {
      const [serial = "", rawState = "unknown", ...metadata] = line.split(/\s+/);
      const properties = Object.fromEntries(
        metadata
          .map((token) => token.split(/:(.*)/s))
          .filter((parts) => parts.length >= 2 && parts[0] && parts[1])
          .map(([key, value]) => [key, value])
      );

      const state = KNOWN_STATES.has(rawState as DeviceConnectionState)
        ? rawState as DeviceConnectionState
        : "unknown";

      return {
        serial,
        state,
        product: properties.product,
        model: properties.model?.replaceAll("_", " "),
        device: properties.device,
        transportId: properties.transport_id
      };
    })
    .filter((device) => Boolean(device.serial));
}
