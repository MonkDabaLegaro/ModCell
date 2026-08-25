import type { ReactNode } from "react";

interface PanelProps {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, eyebrow, children, className = "" }: PanelProps) {
  return (
    <section className={`panel ${className}`.trim()}>
      {(title || eyebrow) && (
        <header className="panel-header">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && <h2>{title}</h2>}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}
