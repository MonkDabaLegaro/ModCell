import type { AdbClient } from "@modcell/android-bridge";
import type { DeviceSnapshot } from "@modcell/contracts";
import { DeviceProfiler } from "./DeviceProfiler.js";

export class DeviceService {
  private readonly profiler: DeviceProfiler;

  constructor(private readonly adb: AdbClient) {
    this.profiler = new DeviceProfiler(adb);
  }

  async snapshot(): Promise<DeviceSnapshot> {
    const descriptors = await this.adb.listDevices();
    const devices = await Promise.all(descriptors.map((descriptor) => this.profiler.profile(descriptor)));

    return {
      generatedAt: new Date().toISOString(),
      devices
    };
  }
}
