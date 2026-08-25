export type DeviceConnectionState = "device" | "offline" | "unauthorized" | "unknown";
export type CapabilityAvailability = "available" | "limited" | "unavailable";

export interface DeviceDescriptor { serial: string; state: DeviceConnectionState; product?: string; model?: string; device?: string; transportId?: string; }
export interface DeviceCapability { id: "adb" | "shell" | "files" | "apps" | "diagnostics" | "root"; label: string; availability: CapabilityAvailability; detail?: string; }
export interface DeviceProfile { serial: string; state: DeviceConnectionState; manufacturer: string | null; brand: string | null; model: string | null; product: string | null; androidVersion: string | null; sdkLevel: number | null; architecture: string | null; batteryLevel: number | null; rooted: boolean; capabilities: DeviceCapability[]; }
export interface DeviceSnapshot { generatedAt: string; devices: DeviceProfile[]; }

export type DeviceFileKind = "file" | "directory";
export interface DeviceFileEntry { name: string; path: string; kind: DeviceFileKind; size: number; modifiedAt: string | null; }
export interface DeviceDirectoryListing { serial: string; path: string; entries: DeviceFileEntry[]; }

export type ApplicationSource = "user" | "system";
export interface ApplicationSummary { packageName: string; apkPath: string; source: ApplicationSource; enabled: boolean; }
export interface ApplicationInventory { serial: string; applications: ApplicationSummary[]; }
export interface ApplicationDetails extends ApplicationSummary { permissions: string[]; }

export interface MemoryDiagnostics { totalBytes: number; usedBytes: number; availableBytes: number; }
export interface StorageDiagnostics extends MemoryDiagnostics { usagePercent: number; }
export interface BatteryDiagnostics { level: number | null; temperatureC: number | null; voltageMv: number | null; status: string | null; }
export interface NetworkInterfaceDiagnostics { name: string; address: string; }
export interface DeviceDiagnosticsSnapshot { serial: string; generatedAt: string; memory: MemoryDiagnostics; storage: StorageDiagnostics; uptimeSeconds: number; loadAverage: [number, number, number]; battery: BatteryDiagnostics; temperaturesC: number[]; network: NetworkInterfaceDiagnostics[]; }
export type LogcatLevel = "V" | "D" | "I" | "W" | "E" | "F";
export interface LogcatResponse { serial: string; level: LogcatLevel; lines: string[]; }

export interface HealthResponse { status: "ok"; service: "modcell-daemon"; version: string; }
export const API_ROUTES = { health: "/api/health", devices: "/api/devices" } as const;
