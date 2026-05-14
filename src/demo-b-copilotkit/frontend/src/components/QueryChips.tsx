export const GOLDEN_QUERIES: string[] = [
  "Fuel breakdown for Cars in 2024",
  "EV growth trend since 2015",
  "Top 10 makes by licensed vehicles",
  "Licensed vs SORN for motorcycles over time",
  "Which fuel type grew fastest in the last 5 years?",
];

export interface QueryChipsProps {
  onPick: (query: string) => void;
}

export function QueryChips({ onPick }: QueryChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {GOLDEN_QUERIES.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onPick(q)}
          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 shadow-sm hover:border-blue-500 hover:text-blue-700"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
