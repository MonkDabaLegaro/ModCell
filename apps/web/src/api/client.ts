import type { DeviceDirectoryListing, DeviceSnapshot } from "@modcell/contracts";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error ?? `ModCell daemon request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export const modcellApi = {
  devices: () => request<DeviceSnapshot>("/api/devices"),
  files: (serial: string, path: string) => request<DeviceDirectoryListing>(`/api/devices/${encodeURIComponent(serial)}/files?path=${encodeURIComponent(path)}`),
  deleteFile: (serial: string, path: string) => request<void>(`/api/devices/${encodeURIComponent(serial)}/files?path=${encodeURIComponent(path)}`, { method: "DELETE" }),
  downloadUrl: (serial: string, path: string) => `/api/devices/${encodeURIComponent(serial)}/files/download?path=${encodeURIComponent(path)}`,
  uploadFile: async (serial: string, path: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`/api/devices/${encodeURIComponent(serial)}/files/upload?path=${encodeURIComponent(path)}`, { method: "POST", body });
    if (!response.ok) throw new Error(`Upload failed (${response.status})`);
  },
  reboot: (serial: string) => request<{ ok: boolean }>(`/api/devices/${encodeURIComponent(serial)}/reboot`, { method: "POST" })
};
