import { useCopilotAction } from "@copilotkit/react-core";
import { ChartSkeleton } from "../components/ChartSkeleton";
import { TopMakesTable, type MakeDatum } from "../components/TopMakesTable";
import { setPanel } from "../state/usePanels";

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
    render: ({ status, args }) => {
      if (status !== "complete") return <ChartSkeleton />;
      const data = (args.data ?? []) as MakeDatum[];
      setPanel(args.panelId as string, { kind: "makes", title: args.title as string, data });
      return <TopMakesTable data={data} />;
    },
  });
}
