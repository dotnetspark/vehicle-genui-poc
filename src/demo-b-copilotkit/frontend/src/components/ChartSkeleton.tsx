export function ChartSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading chart"
      className="flex w-full flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
      style={{ minHeight: 220 }}
    >
      <div className="h-3 w-2/5 animate-pulse rounded bg-slate-200" />
      <div className="h-3 w-1/4 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 flex flex-1 items-end gap-2">
        <div className="h-[40%] w-full animate-pulse rounded bg-slate-200" />
        <div className="h-[70%] w-full animate-pulse rounded bg-slate-200" />
        <div className="h-[55%] w-full animate-pulse rounded bg-slate-200" />
        <div className="h-[85%] w-full animate-pulse rounded bg-slate-200" />
        <div className="h-[30%] w-full animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}
