import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, File, Folder, RefreshCw, Trash2, Upload } from "lucide-react";
import type { DeviceDirectoryListing, DeviceFileEntry } from "@modcell/contracts";
import { modcellApi } from "../../api/client";
import { useDeviceSnapshot } from "../../hooks/useDeviceSnapshot";
import { Panel } from "../../components/ui/Panel";

const ROOT = "/storage/emulated/0";

function parentPath(path: string) {
  if (path === ROOT) return ROOT;
  const parent = path.slice(0, path.lastIndexOf("/"));
  return parent.length >= ROOT.length ? parent : ROOT;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

export function FilesPage() {
  const { snapshot, loading: devicesLoading } = useDeviceSnapshot();
  const device = snapshot?.devices.find((item) => item.state === "device");
  const [path, setPath] = useState(ROOT);
  const [listing, setListing] = useState<DeviceDirectoryListing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    if (!device) return;
    setBusy(true); setError(null);
    try { setListing(await modcellApi.files(device.serial, path)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to list files"); }
    finally { setBusy(false); }
  };

  useEffect(() => { void refresh(); }, [device?.serial, path]);

  const remove = async (entry: DeviceFileEntry) => {
    if (!device || !window.confirm(`Delete ${entry.name}? This cannot be undone.`)) return;
    setBusy(true);
    try { await modcellApi.deleteFile(device.serial, entry.path); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Delete failed"); setBusy(false); }
  };

  const upload = async (file?: File) => {
    if (!device || !file) return;
    setBusy(true);
    try { await modcellApi.uploadFile(device.serial, path, file); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed"); setBusy(false); }
    finally { if (uploadRef.current) uploadRef.current.value = ""; }
  };

  if (!device) return <section className="page"><div className="page-heading"><p className="eyebrow">FILE LAB</p><h1>Shared storage</h1><p>{devicesLoading ? "Detecting Android devices…" : "Connect and authorize a device to browse shared storage."}</p></div></section>;

  return (
    <section className="page">
      <div className="page-heading"><p className="eyebrow">FILE LAB</p><h1>Shared storage</h1><p>Browse, transfer and remove user-accessible files without exposing a raw shell.</p></div>
      <Panel title="File explorer" description={path}>
        <div className="file-toolbar">
          <button className="tool-button" disabled={path === ROOT || busy} onClick={() => setPath(parentPath(path))}><ArrowLeft size={16} />Up</button>
          <button className="tool-button" disabled={busy} onClick={() => void refresh()}><RefreshCw size={16} />Refresh</button>
          <button className="tool-button" disabled={busy} onClick={() => uploadRef.current?.click()}><Upload size={16} />Upload</button>
          <input ref={uploadRef} className="visually-hidden" type="file" onChange={(event) => void upload(event.target.files?.[0])} />
        </div>
        {error && <div className="inline-error">{error}</div>}
        <div className="file-table" role="table" aria-label="Device files">
          <div className="file-row file-header" role="row"><span>Name</span><span>Size</span><span>Modified</span><span>Actions</span></div>
          {(listing?.entries ?? []).map((entry) => (
            <div className="file-row" role="row" key={entry.path}>
              <button className="file-name" disabled={busy || entry.kind !== "directory"} onClick={() => entry.kind === "directory" && setPath(entry.path)}>{entry.kind === "directory" ? <Folder size={17} /> : <File size={17} />}<span>{entry.name}</span></button>
              <span>{entry.kind === "directory" ? "—" : formatSize(entry.size)}</span>
              <span>{entry.modifiedAt ? new Date(entry.modifiedAt).toLocaleString() : "Unknown"}</span>
              <span className="file-actions">{entry.kind === "file" && <a className="icon-action" href={modcellApi.downloadUrl(device.serial, entry.path)} title="Download"><Download size={16} /></a>}<button className="icon-action danger" title="Delete" disabled={busy} onClick={() => void remove(entry)}><Trash2 size={16} /></button></span>
            </div>
          ))}
          {!busy && listing?.entries.length === 0 && <div className="file-empty">This directory is empty.</div>}
          {busy && !listing && <div className="file-empty">Reading device storage…</div>}
        </div>
      </Panel>
    </section>
  );
}
