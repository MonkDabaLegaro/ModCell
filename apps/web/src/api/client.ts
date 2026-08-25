import type { DeviceSnapshot } from "@modcell/contracts";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw new Error(`ModCell daemon request failed (${response.status})`);
  }

  return await response.json() as T;
}

export const modcellApi = {
  devices: () => request<DeviceSnapshot>("/api/devices"),
  reboot: (serial: string) => request<{ ok: boolean }>(`/api/devices/${encodeURIComponent(serial)}/reboot`, {
    method: "POST"
  })
};
