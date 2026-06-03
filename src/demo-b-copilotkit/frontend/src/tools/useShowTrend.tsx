import { useCopilotAction } from "@copilotkit/react-core";
import { TrendChart } from "../components/TrendChart";
import { ProgressPanel } from "../components/ProgressPanel";
import { setPanel } from "../state/usePanels";
import { ZShowTrendArgs } from "../schemas/toolSchemas";
import type { Series } from "../components/TrendChart";

export function useShowTrend() {
  useCopilotAction({
    name: "show_trend",
    description:
      "Render a line chart showing one or more time series. " +
      "Call AFTER query_vehicles has returned rows.",
    parameters: [
      { name: "panelId", type: "string", required: true },
      { name: "title", type: "string", required: true },
      {
        name: "series",
        type: "object[]",
        required: true,
        description: "1 to 4 series",
        attributes: [
          { name: "name", type: "string", required: true },
          {
            name: "points",
            type: "object[]",
            required: true,
            attributes: [
              { name: "x", type: "string", required: true,
                description: "Period label, e.g. '2024' or '2024-Q1'" },
              { name: "y", type: "number", required: true },
            ],
          },
        ],
      },
    ],
    handler: async (rawArgs) => {
      const parsed = ZShowTrendArgs.safeParse(rawArgs);
      if (!parsed.success) {
        const msg = parsed.error.issues.map((i) => i.message).join("; ");
        return { ok: false, error: `Validation failed: ${msg}` };
      }
      const { panelId, title, series } = parsed.data;
      setPanel(panelId, { kind: "trend", title, series });
      return { ok: true, panelId };
    },
    render: ({ status, args }) => {
      const series = (args.series ?? []) as Series[];
      const hasPartial = series.some((s) => s.points?.length > 0);
      if (status === "complete") return <TrendChart series={series} />;
      return (
        <ProgressPanel
          status={status}
          itemCount={series.reduce((acc, s) => acc + (s.points?.length ?? 0), 0)}
          partialContent={hasPartial ? <TrendChart series={series} /> : undefined}
        />
      );
    },
  });
}

