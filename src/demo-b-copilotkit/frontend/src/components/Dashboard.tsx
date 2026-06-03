import { Panel } from "./Panel";
import { FuelBreakdownChart } from "./FuelBreakdownChart";
import { TrendChart } from "./TrendChart";
import { TopMakesTable } from "./TopMakesTable";
import { ChartSkeleton } from "./ChartSkeleton";
import { PanelErrorBoundary } from "./PanelErrorBoundary";
import { usePanels } from "../state/usePanels";

const SPAN: Record<string, string> = {
  fuel: "col-span-12 md:col-span-4",
  makes: "col-span-12 md:col-span-6",
  trend: "col-span-12 md:col-span-8",
  skeleton: "col-span-12 md:col-span-6",
  error: "col-span-12 md:col-span-6",
};

export function Dashboard() {
  const { panels } = usePanels();
  const entries = Object.entries(panels);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-sm text-slate-500">
          Ask a question or pick a chip below to populate the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {entries.map(([id, desc]) => (
        <div key={id} className={SPAN[desc.kind] ?? "col-span-12"}>
          <Panel title={desc.title}>
            <PanelErrorBoundary
              panelLabel={desc.title}
              rawArgs={
                desc.kind === "fuel" ? desc.data
                : desc.kind === "trend" ? desc.series
                : desc.kind === "makes" ? desc.data
                : undefined
              }
            >
              {desc.kind === "fuel" ? <FuelBreakdownChart data={desc.data} /> : null}
              {desc.kind === "trend" ? <TrendChart series={desc.series} /> : null}
              {desc.kind === "makes" ? <TopMakesTable data={desc.data} /> : null}
              {desc.kind === "skeleton" ? <ChartSkeleton /> : null}
              {desc.kind === "error" ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <span className="text-2xl" aria-hidden="true">⚠</span>
                  <p className="text-sm font-medium text-red-700">{desc.message}</p>
                  {desc.rawArgs !== undefined && (
                    <details className="mt-1 w-full text-left">
                      <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700">
                        View raw data
                      </summary>
                      <pre className="mt-1 max-h-40 overflow-auto rounded bg-slate-900 p-2 text-xs text-slate-100">
                        {JSON.stringify(desc.rawArgs, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ) : null}
            </PanelErrorBoundary>
          </Panel>
        </div>
      ))}
    </div>
  );
}

