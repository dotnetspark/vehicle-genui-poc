// Demo A — chart renderer.
// Exports `pickChartType` (pure ladder function) and `renderFromRows` (mounts
// the appropriate Chart.js chart or an HTML table into #root).

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COUNT_LIKE = /(count|total|reg|licensed|sorn|sum)/i;

/** Returns the first key whose name looks like a count/aggregate. */
function countKey(row: Record<string, unknown>): string | undefined {
  return Object.keys(row).find((k) => {
    if (!COUNT_LIKE.test(k)) return false;
    const v = row[k];
    return typeof v === "number" && Number.isFinite(v);
  });
}

/** Resolve fuel name to a brand colour (case-insensitive contains-match). */
function fuelColour(fuel: string): string {
  const u = fuel.toUpperCase();
  if (
    u === "BATTERY ELECTRIC" ||
    u === "FUEL CELL ELECTRIC" ||
    u === "RANGE EXTENDED ELECTRIC"
  )
    return "#16a34a";
  if (u.includes("HYBRID")) return "#2563eb";
  if (u === "PETROL" || u === "DIESEL") return "#6b7280";
  if (u.includes("GAS")) return "#f59e0b";
  return "#d1d5db";
}

// ---------------------------------------------------------------------------
// Precedence ladder
// ---------------------------------------------------------------------------

export type ChartType = "line" | "bar" | "donut" | "table";

/**
 * Pure function — picks the chart type based on row shape.
 * Precedence (highest wins):
 *  1. period_label OR (year AND quarter) → "line"
 *  2. make + count-like                  → "bar"
 *  3. fuel + count-like                  → "donut"
 *  4. else                               → "table"
 */
export function pickChartType(rows: unknown[]): ChartType {
  if (!rows.length) return "table";

  const row = rows[0] as Record<string, unknown>;
  const keys = Object.keys(row);

  if (keys.includes("period_label") || (keys.includes("year") && keys.includes("quarter")))
    return "line";

  if (keys.includes("make") && countKey(row) !== undefined) return "bar";

  if (keys.includes("fuel") && countKey(row) !== undefined) return "donut";

  return "table";
}

// ---------------------------------------------------------------------------
// Root helpers
// ---------------------------------------------------------------------------

let activeChart: Chart | null = null;

function getRoot(): HTMLElement {
  const el = document.getElementById("root");
  if (!el) throw new Error("#root not found");
  return el;
}

function clearRoot(): void {
  if (activeChart) {
    activeChart.destroy();
    activeChart = null;
  }
  const root = getRoot();
  root.innerHTML = "";
}

function makeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.style.maxWidth = "100%";
  canvas.style.maxHeight = "500px";
  return canvas;
}

// ---------------------------------------------------------------------------
// Renderers
// ---------------------------------------------------------------------------

function renderLine(rows: Record<string, unknown>[]): void {
  const capped = rows.slice(0, 200);
  const first = capped[0];

  const hasLabel = Object.prototype.hasOwnProperty.call(first, "period_label");
  const xLabel = (row: Record<string, unknown>): string =>
    hasLabel
      ? String(row["period_label"] ?? "")
      : `${row["year"]} Q${row["quarter"]}`;

  // Identify the "series" dimension (the field that isn't the x-axis or count-like)
  const skipKeys = new Set<string>(["period_label", "year", "quarter"]);
  const ck = countKey(first);
  if (ck) skipKeys.add(ck);

  const seriesCandidates = Object.keys(first).filter((k) => !skipKeys.has(k));
  const seriesKey = seriesCandidates[0]; // may be undefined → single series

  // Collect distinct x labels
  const xLabels = [...new Set(capped.map(xLabel))];

  // Collect distinct series values (cap at 8)
  const seriesValues = seriesKey
    ? [...new Set(capped.map((r) => String(r[seriesKey] ?? "")))].slice(0, 8)
    : ["value"];

  const datasets = seriesValues.map((sv) => {
    const filtered = seriesKey
      ? capped.filter((r) => String(r[seriesKey] ?? "") === sv)
      : capped;
    const data = xLabels.map((xl) => {
      const row = filtered.find((r) => xLabel(r) === xl);
      if (!row || !ck) return null;
      const v = row[ck];
      return typeof v === "number" ? v : null;
    });
    return { label: sv, data, tension: 0.3, fill: false };
  });

  const canvas = makeCanvas();
  getRoot().appendChild(canvas);
  activeChart = new Chart(canvas, {
    type: "line",
    data: { labels: xLabels, datasets },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } },
  });
}

function renderBar(rows: Record<string, unknown>[]): void {
  const capped = rows.slice(0, 50);
  const ck = countKey(capped[0]) ?? "";
  const labels = capped.map((r) => String(r["make"] ?? ""));
  const data = capped.map((r) => {
    const v = r[ck];
    return typeof v === "number" ? v : 0;
  });

  const canvas = makeCanvas();
  getRoot().appendChild(canvas);
  activeChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: ck, data, backgroundColor: "#2563eb" }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { display: false } },
    },
  });
}

function renderDonut(rows: Record<string, unknown>[]): void {
  const capped = rows.slice(0, 12);
  const ck = countKey(capped[0]) ?? "";
  const labels = capped.map((r) => String(r["fuel"] ?? ""));
  const data = capped.map((r) => {
    const v = r[ck];
    return typeof v === "number" ? v : 0;
  });
  const colours = labels.map(fuelColour);

  const canvas = makeCanvas();
  getRoot().appendChild(canvas);
  activeChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data, backgroundColor: colours }],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
    },
  });
}

function renderTable(rows: Record<string, unknown>[]): void {
  const root = getRoot();
  if (!rows.length) {
    const p = document.createElement("p");
    p.textContent = "No data";
    root.appendChild(p);
    return;
  }

  const headers = Object.keys(rows[0]);
  const table = document.createElement("table");
  table.style.cssText =
    "border-collapse:collapse;width:100%;font-size:0.85rem;font-family:sans-serif";

  const thead = document.createElement("thead");
  const hr = document.createElement("tr");
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    th.style.cssText =
      "border:1px solid #d1d5db;padding:4px 8px;background:#f3f4f6;text-align:left";
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    headers.forEach((h) => {
      const td = document.createElement("td");
      td.textContent = String(row[h] ?? "");
      td.style.cssText = "border:1px solid #d1d5db;padding:4px 8px";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  root.appendChild(table);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Clears #root and mounts the appropriate visualisation for `rows`. */
export function renderFromRows(rows: unknown[]): void {
  clearRoot();
  const type = pickChartType(rows);
  console.log("[chart-renderer] type:", type, "rows:", rows.length);

  const typed = rows as Record<string, unknown>[];

  switch (type) {
    case "line":
      renderLine(typed);
      break;
    case "bar":
      renderBar(typed);
      break;
    case "donut":
      renderDonut(typed);
      break;
    default:
      renderTable(typed);
  }
}
