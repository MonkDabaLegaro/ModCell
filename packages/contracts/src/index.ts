export type DeviceConnectionState = "device" | "offline" | "unauthorized" | "unknown";
export type CapabilityAvailability = "available" | "limited" | "unavailable";

export interface DeviceDescriptor {
  serial: string;
  state: DeviceConnectionState;
  product?: string;
  model?: string;
  device?: string;
  transportId?: string;
}

export interface DeviceCapability {
  id: "adb" | "shell" | "files" | "apps" | "diagnostics" | "root";
  label: string;
  availability: CapabilityAvailability;
  detail?: string;
}

export interface DeviceProfile {
  serial: string;
  state: DeviceConnectionState;
  manufacturer: string | null;
  brand: string | null;
  model: string | null;
  product: string | null;
  androidVersion: string | null;
  sdkLevel: number | null;
  architecture: string | null;
  batteryLevel: number | null;
  rooted: boolean;
  capabilities: DeviceCapability[];
}

export interface DeviceSnapshot {
  generatedAt: string;
  devices: DeviceProfile[];
}

export type DeviceFileKind = "file" | "directory";

export interface DeviceFileEntry {
  name: string;
  path: string;
  kind: DeviceFileKind;
  size: number;
  modifiedAt: string | null;
}

export interface DeviceDirectoryListing {
  serial: string;
  path: string;
  entries: DeviceFileEntry[];
}

export interface HealthResponse {
  status: "ok";
  service: "modcell-daemon";
  version: string;
}

export const API_ROUTES = {
  health: "/api/health",
  devices: "/api/devices"
} as const;
