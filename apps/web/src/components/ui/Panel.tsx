import type { ReactNode } from "react";

interface PanelProps {
  title?: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, eyebrow, description, children, className = "" }: PanelProps) {
  return (
    <section className={`panel ${className}`.trim()}>
      {(title || eyebrow || description) && (
        <header className="panel-header">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && <h2>{title}</h2>}
            {description && <p className="panel-description">{description}</p>}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}
