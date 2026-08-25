import {
  Activity,
  Boxes,
  Files,
  HardDrive,
  Images,
  LayoutDashboard,
  MonitorSmartphone,
  Settings,
  ShieldCheck,
  Smartphone
} from "lucide-react";

export const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, enabled: true },
  { id: "files", label: "Files", icon: Files, enabled: false },
  { id: "applications", label: "Applications", icon: Boxes, enabled: false },
  { id: "media", label: "Media", icon: Images, enabled: false },
  { id: "storage", label: "Storage", icon: HardDrive, enabled: false },
  { id: "diagnostics", label: "Diagnostics", icon: Activity, enabled: false },
  { id: "screen", label: "Screen Control", icon: MonitorSmartphone, enabled: false },
  { id: "device", label: "Device", icon: Smartphone, enabled: false },
  { id: "advanced", label: "Advanced", icon: ShieldCheck, enabled: false },
  { id: "settings", label: "Settings", icon: Settings, enabled: false }
] as const;
