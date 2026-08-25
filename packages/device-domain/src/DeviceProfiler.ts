import type { AdbClient } from "@modcell/android-bridge";
import type { DeviceCapability, DeviceDescriptor, DeviceProfile } from "@modcell/contracts";

function numberOrNull(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBatteryLevel(output: string): number | null {
  const match = output.match(/^\s*level:\s*(\d+)\s*$/m);
  return match?.[1] ? numberOrNull(match[1]) : null;
}

export class DeviceProfiler {
  constructor(private readonly adb: AdbClient) {}

  async profile(descriptor: DeviceDescriptor): Promise<DeviceProfile> {
    if (descriptor.state !== "device") {
      return {
        serial: descriptor.serial,
        state: descriptor.state,
        manufacturer: null,
        brand: null,
        model: descriptor.model ?? null,
        product: descriptor.product ?? null,
        androidVersion: null,
        sdkLevel: null,
        architecture: null,
        batteryLevel: null,
        rooted: false,
        capabilities: this.capabilitiesForUnavailableDevice(descriptor.state)
      };
    }

    const [manufacturer, brand, model, product, androidVersion, sdk, architecture, battery, root] = await Promise.all([
      this.adb.getProp(descriptor.serial, "ro.product.manufacturer"),
      this.adb.getProp(descriptor.serial, "ro.product.brand"),
      this.adb.getProp(descriptor.serial, "ro.product.model"),
      this.adb.getProp(descriptor.serial, "ro.product.name"),
      this.adb.getProp(descriptor.serial, "ro.build.version.release"),
      this.adb.getProp(descriptor.serial, "ro.build.version.sdk"),
      this.adb.getProp(descriptor.serial, "ro.product.cpu.abi"),
      this.adb.shell(descriptor.serial, ["dumpsys", "battery"], 5_000),
      this.adb.shell(descriptor.serial, ["su", "-c", "id"], 2_500)
    ]);

    const rooted = root.exitCode === 0 && /uid=0\b/.test(root.stdout);

    return {
      serial: descriptor.serial,
      state: descriptor.state,
      manufacturer,
      brand,
      model: model ?? descriptor.model ?? null,
      product: product ?? descriptor.product ?? null,
      androidVersion,
      sdkLevel: numberOrNull(sdk),
      architecture,
      batteryLevel: battery.exitCode === 0 ? parseBatteryLevel(battery.stdout) : null,
      rooted,
      capabilities: this.capabilitiesForConnectedDevice(rooted)
    };
  }

  private capabilitiesForConnectedDevice(rooted: boolean): DeviceCapability[] {
    return [
      { id: "adb", label: "ADB", availability: "available", detail: "Device authorized" },
      { id: "shell", label: "Android shell", availability: "available" },
      { id: "files", label: "Accessible files", availability: "available", detail: "Subject to Android storage permissions" },
      { id: "apps", label: "Application management", availability: "available", detail: "System packages may be protected" },
      { id: "diagnostics", label: "Diagnostics", availability: "available" },
      {
        id: "root",
        label: "Root operations",
        availability: rooted ? "available" : "unavailable",
        detail: rooted ? "su returned uid=0" : "No privileged shell detected"
      }
    ];
  }

  private capabilitiesForUnavailableDevice(state: DeviceDescriptor["state"]): DeviceCapability[] {
    const detail = state === "unauthorized" ? "Approve the USB debugging prompt on the phone" : "Device is not ready";
    return [
      { id: "adb", label: "ADB", availability: "limited", detail },
      { id: "shell", label: "Android shell", availability: "unavailable", detail },
      { id: "files", label: "Accessible files", availability: "unavailable", detail },
      { id: "apps", label: "Application management", availability: "unavailable", detail },
      { id: "diagnostics", label: "Diagnostics", availability: "unavailable", detail },
      { id: "root", label: "Root operations", availability: "unavailable", detail }
    ];
  }
}
