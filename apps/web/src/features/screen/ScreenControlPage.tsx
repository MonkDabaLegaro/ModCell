import { useEffect, useMemo, useState } from "react";
import { Download, MonitorPlay, Octagon, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import { modcellApi, type ScreenSessionStatus, type ScreenToolStatus } from "../../api/client";
import { Panel } from "../../components/ui/Panel";
import { useDeviceSnapshot } from "../../hooks/useDeviceSnapshot";
import "./screen.css";

export function ScreenControlPage() {
  const { snapshot, error: deviceError } = useDeviceSnapshot();
  const device = snapshot.devices.find((item) => item.state === "device");
  const [tool, setTool] = useState<ScreenToolStatus | null>(null);
  const [session, setSession] = useState<ScreenSessionStatus | null>(null);
  const [maxSize, setMaxSize] = useState(1600);
  const [bitRate, setBitRate] = useState(8);
  const [stayAwake, setStayAwake] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serial = device?.serial ?? null;
  const ready = Boolean(tool?.executablePath);

  const refresh = async () => {
    try {
      const nextTool = await modcellApi.screenTool();
      setTool(nextTool);
      if (serial) setSession(await modcellApi.screenStatus(serial)); else setSession(null);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to read screen control state");
    }
  };

  useEffect(() => { void refresh(); }, [serial]);

  const toolLabel = useMemo(() => {
    if (!tool) return "Checking";
    if (tool.source === "unavailable") return "Not prepared";
    return `${tool.name} ${tool.version} · ${tool.source}`;
  }, [tool]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try { await action(); await refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Screen control action failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="page screen-page">
      <header className="page-heading">
        <p className="eyebrow">Native mirror & control</p>
        <h1>Screen Control</h1>
        <p>Launch a constrained scrcpy session for the authorized Android device. ModCell manages the toolchain and process lifecycle locally.</p>
      </header>

      {(error || deviceError) && <div className="inline-error">{error ?? deviceError}</div>}

      <div className="screen-status-grid">
        <Panel eyebrow="Device" title={device ? device.model ?? device.serial : "No authorized device"}>
          <div className="screen-status-body"><Smartphone size={22} /><span>{device ? device.serial : "Connect and authorize Android over ADB"}</span></div>
        </Panel>
        <Panel eyebrow="Toolchain" title={toolLabel}>
          <div className="screen-status-body"><ShieldCheck size={22} /><span>{tool?.detail ?? (ready ? "scrcpy executable resolved" : "Managed installation available")}</span></div>
        </Panel>
        <Panel eyebrow="Session" title={session?.running ? "Running" : "Stopped"}>
          <div className="screen-status-body"><MonitorPlay size={22} /><span>{session?.running ? `PID ${session.pid ?? "—"}` : "No active mirror session"}</span></div>
        </Panel>
      </div>

      <Panel eyebrow="Controls" title="Mirror configuration">
        <div className="screen-controls">
          <label><span>Max size</span><input type="number" min={320} max={4096} value={maxSize} onChange={(event) => setMaxSize(Number(event.target.value))} /></label>
          <label><span>Video bitrate (Mbps)</span><input type="number" min={1} max={64} value={bitRate} onChange={(event) => setBitRate(Number(event.target.value))} /></label>
          <label className="screen-check"><input type="checkbox" checked={stayAwake} onChange={(event) => setStayAwake(event.target.checked)} /><span>Keep device awake while mirroring</span></label>
        </div>
        <div className="screen-actions">
          <button className="tool-button" type="button" disabled={busy} onClick={() => void refresh()}><RefreshCw size={15} />Refresh</button>
          {!ready && <button className="tool-button" type="button" disabled={busy} onClick={() => void run(() => modcellApi.ensureScreenTool())}><Download size={15} />Prepare scrcpy 4.1</button>}
          {!session?.running ? (
            <button className="tool-button screen-primary" type="button" disabled={busy || !serial} onClick={() => serial && void run(() => modcellApi.startScreen(serial, { maxSize, videoBitRateMbps: bitRate, stayAwake }))}><MonitorPlay size={15} />Start screen</button>
          ) : (
            <button className="tool-button screen-danger" type="button" disabled={busy || !serial} onClick={() => serial && void run(() => modcellApi.stopScreen(serial))}><Octagon size={15} />Stop screen</button>
          )}
        </div>
      </Panel>
    </div>
  );
}
