import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface FuelDatum {
  fuel: string;
  count: number;
  percentage: number;
}

const FUEL_COLOURS: Record<string, string> = {
  electric: "#10b981",
  hybrid: "#3b82f6",
  petrol: "#6b7280",
  diesel: "#374151",
  gas: "#f59e0b",
  other: "#d1d5db",
};

function colourFor(fuel: string): string {
  const key = fuel.toLowerCase();
  for (const k of Object.keys(FUEL_COLOURS)) {
    if (key.includes(k)) return FUEL_COLOURS[k];
  }
  return FUEL_COLOURS.other;
}

export interface FuelBreakdownChartProps {
  data: FuelDatum[];
}

export function FuelBreakdownChart({ data }: FuelBreakdownChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="fuel"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={1}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={colourFor(d.fuel)} />
          ))}
        </Pie>
        <Tooltip
          formatter={((value: number, _name: unknown, item: { payload?: FuelDatum }) => {
            const pct = item?.payload?.percentage;
            return [
              `${value.toLocaleString()}${pct != null ? ` (${pct.toFixed(1)}%)` : ""}`,
              item?.payload?.fuel ?? "",
            ];
          }) as never}
        />
        <Legend verticalAlign="bottom" height={24} />
      </PieChart>
    </ResponsiveContainer>
  );
}
