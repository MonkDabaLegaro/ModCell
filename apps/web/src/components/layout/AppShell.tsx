import type { ReactNode } from "react";
import { CircleDot, Leaf } from "lucide-react";
import { navigation } from "../../app/navigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Leaf size={18} strokeWidth={1.6} /></div>
          <div>
            <strong>ModCell</strong>
            <span>Android laboratory</span>
          </div>
        </div>

        <nav className="navigation" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon, enabled }) => (
            <button
              className={`nav-item ${id === "overview" ? "is-active" : ""}`}
              type="button"
              disabled={!enabled}
              key={id}
            >
              <Icon size={17} strokeWidth={1.55} />
              <span>{label}</span>
              {!enabled && <span className="nav-soon">soon</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <CircleDot size={14} strokeWidth={1.6} />
          <span>Local-only control plane</span>
        </div>
      </aside>

      <main className="workspace">{children}</main>
    </div>
  );
}
