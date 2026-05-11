import type { ReactNode } from "react";

export interface PanelProps {
  title: string;
  caption?: string;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, caption, children, className = "" }: PanelProps) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      <header className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {caption ? <p className="text-xs text-slate-500">{caption}</p> : null}
      </header>
      <div className="h-72 w-full">{children}</div>
    </section>
  );
}
