import type { ApplicationDetails, ApplicationInventory, DeviceDiagnosticsSnapshot, DeviceDirectoryListing, DeviceSnapshot, LogcatLevel, LogcatResponse } from "@modcell/contracts";
async function request<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } }); if (!response.ok) { const payload = await response.json().catch(() => null) as { error?: string } | null; throw new Error(payload?.error ?? `ModCell daemon request failed (${response.status})`); } if (response.status === 204) return undefined as T; return await response.json() as T; }
export const modcellApi = {
  devices: () => request<DeviceSnapshot>("/api/devices"),
  files: (serial: string, path: string) => request<DeviceDirectoryListing>(`/api/devices/${encodeURIComponent(serial)}/files?path=${encodeURIComponent(path)}`),
  deleteFile: (serial: string, path: string) => request<void>(`/api/devices/${encodeURIComponent(serial)}/files?path=${encodeURIComponent(path)}`, { method: "DELETE" }),
  downloadUrl: (serial: string, path: string) => `/api/devices/${encodeURIComponent(serial)}/files/download?path=${encodeURIComponent(path)}`,
  uploadFile: async (serial: string, path: string, file: File) => { const body = new FormData(); body.append("file", file); const response = await fetch(`/api/devices/${encodeURIComponent(serial)}/files/upload?path=${encodeURIComponent(path)}`, { method: "POST", body }); if (!response.ok) throw new Error(`Upload failed (${response.status})`); },
  applications: (serial: string) => request<ApplicationInventory>(`/api/devices/${encodeURIComponent(serial)}/applications`),
  applicationDetails: (serial: string, packageName: string) => request<ApplicationDetails>(`/api/devices/${encodeURIComponent(serial)}/applications/${encodeURIComponent(packageName)}`),
  setApplicationEnabled: (serial: string, packageName: string, enabled: boolean) => request<{ ok: boolean }>(`/api/devices/${encodeURIComponent(serial)}/applications/${encodeURIComponent(packageName)}/enabled`, { method: "POST", body: JSON.stringify({ enabled }) }),
  clearApplicationData: (serial: string, packageName: string) => request<{ ok: boolean }>(`/api/devices/${encodeURIComponent(serial)}/applications/${encodeURIComponent(packageName)}/clear-data`, { method: "POST" }),
  uninstallApplication: (serial: string, packageName: string) => request<void>(`/api/devices/${encodeURIComponent(serial)}/applications/${encodeURIComponent(packageName)}`, { method: "DELETE" }),
  installApplication: async (serial: string, file: File) => { const body = new FormData(); body.append("file", file); const response = await fetch(`/api/devices/${encodeURIComponent(serial)}/applications/install`, { method: "POST", body }); if (!response.ok) { const payload = await response.json().catch(() => null) as { error?: string } | null; throw new Error(payload?.error ?? `Install failed (${response.status})`); } },
  diagnostics: (serial: string) => request<DeviceDiagnosticsSnapshot>(`/api/devices/${encodeURIComponent(serial)}/diagnostics`),
  logcat: (serial: string, level: LogcatLevel = "V", lines = 200) => request<LogcatResponse>(`/api/devices/${encodeURIComponent(serial)}/diagnostics/logcat?level=${level}&lines=${lines}`),
  bugreportUrl: (serial: string) => `/api/devices/${encodeURIComponent(serial)}/diagnostics/bugreport`,
  reboot: (serial: string) => request<{ ok: boolean }>(`/api/devices/${encodeURIComponent(serial)}/reboot`, { method: "POST" })
};
