import { Panel } from "./Panel";
import { FuelBreakdownChart } from "./FuelBreakdownChart";
import { TrendChart } from "./TrendChart";
import { TopMakesTable } from "./TopMakesTable";
import { ChartSkeleton } from "./ChartSkeleton";
import { usePanels } from "../state/usePanels";

const SPAN: Record<string, string> = {
  fuel: "col-span-12 md:col-span-4",
  makes: "col-span-12 md:col-span-6",
  trend: "col-span-12 md:col-span-8",
  skeleton: "col-span-12 md:col-span-6",
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
            {desc.kind === "fuel" ? <FuelBreakdownChart data={desc.data} /> : null}
            {desc.kind === "trend" ? <TrendChart series={desc.series} /> : null}
            {desc.kind === "makes" ? <TopMakesTable data={desc.data} /> : null}
            {desc.kind === "skeleton" ? <ChartSkeleton /> : null}
          </Panel>
        </div>
      ))}
    </div>
  );
}
