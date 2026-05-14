import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export interface MakeDatum {
  make: string;
  count: number;
}

export interface TopMakesTableProps {
  data: MakeDatum[];
}

export function TopMakesTable({ data }: TopMakesTableProps) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 8, right: 16, bottom: 8, left: 32 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="make"
          tick={{ fontSize: 12 }}
          width={80}
        />
        <Tooltip formatter={((v: number) => v.toLocaleString()) as never} />
        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
