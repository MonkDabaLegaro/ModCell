import { BatteryMedium, Cpu, Radio, ShieldCheck, Smartphone } from "lucide-react";
import { MetricCard } from "../../components/ui/MetricCard";
import { Panel } from "../../components/ui/Panel";
import { useDeviceSnapshot } from "../../hooks/useDeviceSnapshot";
import { CapabilityPanel } from "./CapabilityPanel";

export function OverviewPage() {
  const { snapshot, loading, error } = useDeviceSnapshot();
  const device = snapshot.devices[0];

  return (
    <div className="overview-page">
      <header className="topbar">
        <div>
          <span className="eyebrow">Local control center</span>
          <h1>Android laboratory</h1>
        </div>
        <div className={`connection-pill ${device?.state === "device" ? "is-online" : ""}`}>
          <span className="connection-dot" />
          {device ? `${device.model ?? device.serial} · ${device.state}` : "Waiting for USB device"}
        </div>
      </header>

      {error && (
        <div className="notice is-error">
          <strong>Daemon unavailable</strong>
          <span>{error}. Start ModCell with pnpm dev.</span>
        </div>
      )}

      {!device ? (
        <Panel className="empty-device">
          <div className="device-orbit"><Smartphone size={42} strokeWidth={1.1} /></div>
          <span className="eyebrow">Discovery active</span>
          <h2>{loading ? "Scanning Android bridge" : "Connect an Android device"}</h2>
          <p>Enable USB debugging, connect the phone and approve the computer. ModCell will profile it automatically.</p>
          <div className="scan-line"><span /></div>
        </Panel>
      ) : (
        <>
          <Panel className="device-hero">
            <div className="device-identity">
              <div className="device-symbol"><Smartphone size={30} strokeWidth={1.25} /></div>
              <div>
                <span className="eyebrow">Connected device</span>
                <h2>{device.model ?? "Android device"}</h2>
                <p>{[device.manufacturer, device.androidVersion && `Android ${device.androidVersion}`, device.architecture].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            <div className="serial-block">
              <span>Serial</span>
              <code>{device.serial}</code>
            </div>
          </Panel>

          <div className="metric-grid">
            <MetricCard icon={BatteryMedium} label="Battery" value={device.batteryLevel === null ? "—" : `${device.batteryLevel}%`} detail="Live device state" />
            <MetricCard icon={Cpu} label="Architecture" value={device.architecture ?? "Unknown"} detail={`SDK ${device.sdkLevel ?? "—"}`} />
            <MetricCard icon={Radio} label="ADB" value={device.state === "device" ? "Ready" : device.state} detail="USB transport" />
            <MetricCard icon={ShieldCheck} label="Root" value={device.rooted ? "Available" : "Standard"} detail={device.rooted ? "Privileged shell detected" : "Protected Android mode"} />
          </div>

          <div className="overview-grid">
            <CapabilityPanel capabilities={device.capabilities} />
            <Panel eyebrow="Activity" title="Live analysis">
              <div className="activity-list">
                <div className="activity-row"><span className="activity-dot" /><div><strong>Device discovered</strong><small>ADB serial registered</small></div></div>
                <div className="activity-row"><span className="activity-dot" /><div><strong>Profile completed</strong><small>System properties and battery queried</small></div></div>
                <div className="activity-row"><span className="activity-dot" /><div><strong>Capabilities resolved</strong><small>Features adapt to the connected device</small></div></div>
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
