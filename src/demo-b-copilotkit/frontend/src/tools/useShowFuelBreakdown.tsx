import { useCopilotAction } from "@copilotkit/react-core";
import { ChartSkeleton } from "../components/ChartSkeleton";
import { FuelBreakdownChart, type FuelDatum } from "../components/FuelBreakdownChart";
import { setPanel } from "../state/usePanels";

export function useShowFuelBreakdown() {
  useCopilotAction({
    name: "show_fuel_breakdown",
    available: "frontend",
    description:
      "Render a donut chart showing the fuel-type distribution for a slice of the vehicle data. " +
      "Call AFTER query_vehicles has returned rows.",
    parameters: [
      { name: "panelId", type: "string", required: true,
        description: "Stable id; reusing it replaces the existing panel." },
      { name: "title", type: "string", required: true },
      {
        name: "data",
        type: "object[]",
        required: true,
        description: "One row per fuel type",
        attributes: [
          { name: "fuel", type: "string", required: true },
          { name: "count", type: "number", required: true },
          { name: "percentage", type: "number", required: true },
        ],
      },
    ],
    render: ({ status, args }) => {
      if (status !== "complete") return <ChartSkeleton />;
      const data = (args.data ?? []) as FuelDatum[];
      setPanel(args.panelId as string, { kind: "fuel", title: args.title as string, data });
      return <FuelBreakdownChart data={data} />;
    },
  });
}
