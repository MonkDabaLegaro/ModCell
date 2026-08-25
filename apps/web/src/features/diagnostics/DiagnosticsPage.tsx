import { Activity, BatteryMedium, Clock3, Download, Gauge, HardDrive, MemoryStick, Network, RefreshCw, Thermometer } from "lucide-react";
import { useEffect, useState } from "react";
import type { DeviceDiagnosticsSnapshot, LogcatLevel } from "@modcell/contracts";
import { modcellApi } from "../../api/client";
import { Panel } from "../../components/ui/Panel";
import { useDeviceSnapshot } from "../../hooks/useDeviceSnapshot";
import "./diagnostics.css";

const bytes = (value: number) => `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
const duration = (seconds: number) => `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;

export function DiagnosticsPage() {
  const { snapshot } = useDeviceSnapshot();
  const device = snapshot.devices.find((item) => item.state === "device");
  const [data, setData] = useState<DeviceDiagnosticsSnapshot | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [level, setLevel] = useState<LogcatLevel>("W");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!device) return;
    setBusy(true); setError(null);
    try { setData(await modcellApi.diagnostics(device.serial)); }
    catch (err) { setError(err instanceof Error ? err.message : "Diagnostics failed"); }
    finally { setBusy(false); }
  };
  useEffect(() => { setData(null); setLogs([]); void refresh(); }, [device?.serial]);
  const loadLogs = async () => { if (!device) return; setBusy(true); setError(null); try { setLogs((await modcellApi.logcat(device.serial, level, 300)).lines); } catch (err) { setError(err instanceof Error ? err.message : "Logcat failed"); } finally { setBusy(false); } };

  if (!device) return <div className="page"><header className="page-heading"><p className="eyebrow">Observability</p><h1>Diagnostics</h1><p>Connect and authorize an Android device to inspect its runtime state.</p></header></div>;
  return <div className="page diagnostics-page">
    <header className="page-heading diagnostics-heading"><div><p className="eyebrow">Observability</p><h1>Diagnostics</h1><p>Read-only runtime inspection for {device.model ?? device.serial}. Metrics are collected through bounded ADB operations.</p></div><div className="diagnostic-actions"><button className="tool-button" onClick={() => void refresh()} disabled={busy}><RefreshCw size={14}/>Refresh</button><a className="tool-button" href={modcellApi.bugreportUrl(device.serial)}><Download size={14}/>Bugreport</a></div></header>
    {error && <div className="inline-error">{error}</div>}
    {data && <>
      <div className="diagnostic-grid">
        <div className="diagnostic-card"><MemoryStick/><span>Memory</span><strong>{bytes(data.memory.usedBytes)} / {bytes(data.memory.totalBytes)}</strong><small>{bytes(data.memory.availableBytes)} available</small></div>
        <div className="diagnostic-card"><HardDrive/><span>Shared storage</span><strong>{data.storage.usagePercent}% used</strong><small>{bytes(data.storage.availableBytes)} available</small></div>
        <div className="diagnostic-card"><BatteryMedium/><span>Battery</span><strong>{data.battery.level ?? "—"}%</strong><small>{data.battery.temperatureC ?? "—"} °C · {data.battery.voltageMv ?? "—"} mV</small></div>
        <div className="diagnostic-card"><Clock3/><span>Uptime</span><strong>{duration(data.uptimeSeconds)}</strong><small>Since last boot</small></div>
        <div className="diagnostic-card"><Gauge/><span>Load average</span><strong>{data.loadAverage.map((v) => v.toFixed(2)).join(" · ")}</strong><small>1 · 5 · 15 minutes</small></div>
        <div className="diagnostic-card"><Thermometer/><span>Thermals</span><strong>{data.temperaturesC.length ? `${Math.max(...data.temperaturesC).toFixed(1)} °C` : "Unavailable"}</strong><small>{data.temperaturesC.length} readable sensors</small></div>
      </div>
      <Panel eyebrow="Network" title="Active interfaces"><div className="diagnostic-list">{data.network.length ? data.network.map((item) => <div key={`${item.name}-${item.address}`}><Network size={14}/><code>{item.name}</code><span>{item.address}</span></div>) : <p>No active IP interfaces reported.</p>}</div></Panel>
    </>}
    <Panel eyebrow="Logcat" title="Controlled log capture"><div className="log-toolbar"><select value={level} onChange={(event) => setLevel(event.target.value as LogcatLevel)}>{["V","D","I","W","E","F"].map((item) => <option key={item}>{item}</option>)}</select><button className="tool-button" onClick={() => void loadLogs()} disabled={busy}><Activity size={14}/>Capture 300 lines</button></div><pre className="log-view">{logs.length ? logs.join("\n") : "No log capture loaded."}</pre></Panel>
  </div>;
}
