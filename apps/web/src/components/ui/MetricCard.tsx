import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}

export function MetricCard({ label, value, detail, icon: Icon }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-icon"><Icon size={18} strokeWidth={1.5} /></div>
      <div className="metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}
