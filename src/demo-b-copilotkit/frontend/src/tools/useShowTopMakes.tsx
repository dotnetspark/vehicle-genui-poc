import { useCopilotAction } from "@copilotkit/react-core";
import { TopMakesTable } from "../components/TopMakesTable";
import { ProgressPanel } from "../components/ProgressPanel";
import { setPanel } from "../state/usePanels";
import { ZShowTopMakesArgs } from "../schemas/toolSchemas";
import type { MakeDatum } from "../components/TopMakesTable";

export function useShowTopMakes() {
  useCopilotAction({
    name: "show_top_makes",
    description:
      "Render a horizontal bar chart of top vehicle makes by count. " +
      "Call AFTER query_vehicles has returned rows.",
    parameters: [
      { name: "panelId", type: "string", required: true },
      { name: "title", type: "string", required: true },
      {
        name: "data",
        type: "object[]",
        required: true,
        attributes: [
          { name: "make", type: "string", required: true },
          { name: "count", type: "number", required: true },
        ],
      },
    ],
    handler: async (rawArgs) => {
      const parsed = ZShowTopMakesArgs.safeParse(rawArgs);
      if (!parsed.success) {
        const msg = parsed.error.issues.map((i) => i.message).join("; ");
        return { ok: false, error: `Validation failed: ${msg}` };
      }
      const { panelId, title, data } = parsed.data;
      setPanel(panelId, { kind: "makes", title, data });
      return { ok: true, panelId };
    },
    render: ({ status, args }) => {
      const data = (args.data ?? []) as MakeDatum[];
      const hasPartial = data.length > 0;
      if (status === "complete") return <TopMakesTable data={data} />;
      return (
        <ProgressPanel
          status={status}
          itemCount={data.length}
          partialContent={hasPartial ? <TopMakesTable data={data} /> : undefined}
        />
      );
    },
  });
}

