import { Box, PackagePlus, RefreshCw, Search, Shield, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ApplicationSummary } from "@modcell/contracts";
import { modcellApi } from "../../api/client";
import { Panel } from "../../components/ui/Panel";
import { useDeviceSnapshot } from "../../hooks/useDeviceSnapshot";

export function ApplicationsPage() {
  const { snapshot } = useDeviceSnapshot();
  const device = snapshot.devices.find((item) => item.state === "device");
  const [apps, setApps] = useState<ApplicationSummary[]>([]);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"all" | "user" | "system">("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    if (!device) { setApps([]); return; }
    setBusy(true); setError(null);
    try { setApps((await modcellApi.applications(device.serial)).applications); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load applications"); }
    finally { setBusy(false); }
  };
  useEffect(() => { void refresh(); }, [device?.serial]);

  const visible = useMemo(() => apps.filter((app) => (source === "all" || app.source === source) && app.packageName.toLowerCase().includes(query.toLowerCase())), [apps, query, source]);
  const mutate = async (action: () => Promise<unknown>) => { setBusy(true); setError(null); try { await action(); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : "Operation failed"); setBusy(false); } };

  if (!device) return <div className="page"><div className="page-heading"><p className="eyebrow">Applications</p><h1>Application manager</h1><p>Connect and authorize an Android device to inspect installed packages.</p></div></div>;

  return <div className="page">
    <div className="page-heading"><p className="eyebrow">Applications</p><h1>Application manager</h1><p>Inspect user and system packages. Standard mode keeps system applications read-only.</p></div>
    <Panel title="Installed packages" description={`${apps.length} packages detected`}>
      <div className="panel-body">
        <div className="app-toolbar">
          <label className="search-field"><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search package name" /></label>
          <select value={source} onChange={(event) => setSource(event.target.value as typeof source)}><option value="all">All</option><option value="user">User</option><option value="system">System</option></select>
          <button className="tool-button" disabled={busy} onClick={() => void refresh()}><RefreshCw size={14}/> Refresh</button>
          <button className="tool-button" disabled={busy} onClick={() => fileInput.current?.click()}><PackagePlus size={14}/> Install APK</button>
          <input ref={fileInput} className="visually-hidden" type="file" accept=".apk,application/vnd.android.package-archive" onChange={(event) => { const file = event.target.files?.[0]; if (file) void mutate(() => modcellApi.installApplication(device.serial, file)); event.currentTarget.value = ""; }} />
        </div>
        {error && <div className="inline-error">{error}</div>}
        <div className="app-table">
          <div className="app-row app-header"><span>Package</span><span>Type</span><span>Status</span><span>Actions</span></div>
          {visible.map((app) => <div className="app-row" key={app.packageName}>
            <div className="package-cell">{app.source === "system" ? <Shield size={16}/> : <Box size={16}/>}<div><strong>{app.packageName}</strong><small>{app.apkPath}</small></div></div>
            <span className={`source-pill is-${app.source}`}>{app.source}</span>
            <span>{app.enabled ? "Enabled" : "Disabled"}</span>
            <div className="app-actions">
              {app.source === "user" ? <>
                <button className="tool-button" disabled={busy} onClick={() => { if (confirm(`${app.enabled ? "Disable" : "Enable"} ${app.packageName}?`)) void mutate(() => modcellApi.setApplicationEnabled(device.serial, app.packageName, !app.enabled)); }}>{app.enabled ? "Disable" : "Enable"}</button>
                <button className="tool-button" disabled={busy} onClick={() => { if (confirm(`Clear all app data for ${app.packageName}?`)) void mutate(() => modcellApi.clearApplicationData(device.serial, app.packageName)); }}>Clear data</button>
                <button className="icon-action danger" title="Uninstall" disabled={busy} onClick={() => { if (confirm(`Uninstall ${app.packageName} for the current Android user?`)) void mutate(() => modcellApi.uninstallApplication(device.serial, app.packageName)); }}><Trash2 size={14}/></button>
              </> : <span className="read-only-label">Read only</span>}
            </div>
          </div>)}
          {!busy && visible.length === 0 && <div className="file-empty">No applications match the current filter.</div>}
        </div>
      </div>
    </Panel>
  </div>;
}
