import type { DeviceSnapshot } from "@modcell/contracts";
import { useEffect, useState } from "react";
import { modcellApi } from "../api/client";

const EMPTY: DeviceSnapshot = { generatedAt: new Date(0).toISOString(), devices: [] };

export function useDeviceSnapshot(intervalMs = 2_500) {
  const [snapshot, setSnapshot] = useState<DeviceSnapshot>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const next = await modcellApi.devices();
        if (!cancelled) {
          setSnapshot(next);
          setError(null);
        }
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Unable to reach ModCell daemon");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [intervalMs]);

  return { snapshot, loading, error };
}
