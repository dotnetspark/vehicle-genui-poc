import type { ReactNode } from "react";
import { ChartSkeleton } from "./ChartSkeleton";

interface ProgressPanelProps {
  /** CopilotKit action status */
  status: string;
  /** Number of items already streamed (0 when unknown) */
  itemCount?: number;
  /** Partial content to render while streaming — if undefined we show skeleton */
  partialContent?: ReactNode;
}

/**
 * Renders the three distinct progression states that appear in the
 * CopilotKit chat-inline render slot for each tool:
 *
 *   pending    → grey skeleton + "Waiting…" badge
 *   inProgress → amber skeleton/partial chart + "Streaming…" badge
 *   executing  → skeleton + "Processing…" badge
 *   complete   → (caller renders the real chart; this component is not shown)
 */
export function ProgressPanel({
  status,
  itemCount = 0,
  partialContent,
}: ProgressPanelProps) {
  const badge = statusBadge(status, itemCount);

  return (
    <div className="relative">
      {partialContent ?? <ChartSkeleton />}
      <span
        className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}
      >
        {badge.label}
      </span>
    </div>
  );
}

function statusBadge(
  status: string,
  itemCount: number,
): { label: string; className: string } {
  switch (status) {
    case "inProgress":
      return {
        label: itemCount > 0 ? `Streaming… (${itemCount})` : "Streaming…",
        className: "bg-amber-100 text-amber-700",
      };
    case "executing":
      return {
        label: "Processing…",
        className: "bg-blue-100 text-blue-700",
      };
    default:
      return {
        label: "Pending…",
        className: "bg-slate-100 text-slate-500",
      };
  }
}
