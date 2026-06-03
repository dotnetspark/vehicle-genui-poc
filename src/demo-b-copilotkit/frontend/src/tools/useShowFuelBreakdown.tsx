import { useCopilotAction } from "@copilotkit/react-core";
import { FuelBreakdownChart } from "../components/FuelBreakdownChart";
import { ProgressPanel } from "../components/ProgressPanel";
import { setPanel } from "../state/usePanels";
import { ZShowFuelBreakdownArgs } from "../schemas/toolSchemas";
import type { FuelDatum } from "../components/FuelBreakdownChart";

export function useShowFuelBreakdown() {
  useCopilotAction({
    name: "show_fuel_breakdown",
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
    handler: async (rawArgs) => {
      const parsed = ZShowFuelBreakdownArgs.safeParse(rawArgs);
      if (!parsed.success) {
        const msg = parsed.error.issues.map((i) => i.message).join("; ");
        return { ok: false, error: `Validation failed: ${msg}` };
      }
      const { panelId, title, data } = parsed.data;
      setPanel(panelId, { kind: "fuel", title, data });
      return { ok: true, panelId };
    },
    render: ({ status, args }) => {
      const data = (args.data ?? []) as FuelDatum[];
      const hasPartial = data.length > 0;
      if (status === "complete") return <FuelBreakdownChart data={data} />;
      return (
        <ProgressPanel
          status={status}
          itemCount={data.length}
          partialContent={hasPartial ? <FuelBreakdownChart data={data} /> : undefined}
        />
      );
    },
  });
}

