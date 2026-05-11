import { useCopilotAction } from "@copilotkit/react-core";
import { ChartSkeleton } from "../components/ChartSkeleton";
import { TrendChart, type Series } from "../components/TrendChart";
import { setPanel } from "../state/usePanels";

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
    render: ({ status, args }) => {
      if (status !== "complete") return <ChartSkeleton />;
      const series = (args.series ?? []) as Series[];
      setPanel(args.panelId as string, { kind: "trend", title: args.title as string, series });
      return <TrendChart series={series} />;
    },
  });
}
