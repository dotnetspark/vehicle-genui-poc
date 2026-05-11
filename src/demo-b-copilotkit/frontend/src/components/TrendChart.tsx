import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export interface SeriesPoint {
  x: string | number;
  y: number;
}

export interface Series {
  name: string;
  points: SeriesPoint[];
}

export interface TrendChartProps {
  title?: string;
  series: Series[];
}

const COLOURS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export function TrendChart({ series }: TrendChartProps) {
  const xs = new Set<string | number>();
  for (const s of series) for (const p of s.points) xs.add(p.x);
  const xList = Array.from(xs).sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { numeric: true }),
  );
  const data = xList.map((x) => {
    const row: Record<string, string | number> = { x };
    for (const s of series) {
      const pt = s.points.find((p) => p.x === x);
      if (pt) row[s.name] = pt.y;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="x" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {series.map((s, i) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={COLOURS[i % COLOURS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
