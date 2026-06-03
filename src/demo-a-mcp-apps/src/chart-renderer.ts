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
    return toNumber(row[k]) !== null;
  });
}

/**
 * Coerce a value to a finite number. Accepts JS numbers and numeric strings —
 * node-postgres returns Postgres BIGINT (and any aggregate over BIGINT, e.g.
 * COUNT(*) and SUM(count)) as strings to preserve precision. Without this
 * coercion the chart-renderer silently falls back to a plain table for every
 * aggregated query.
 */
function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.length > 0) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Modern AI-style theme — light surface, indigo / violet / cyan accents.
// Designed to read on a clean white-ish canvas (matches Claude Desktop's
// default light UI). The bundled mcp-app.html shell uses the same palette.
// ---------------------------------------------------------------------------

const THEME = {
  bg: "#ffffff",             // page canvas
  surface: "#f8fafc",        // panel / table surface
  fg: "#0f172a",             // primary text (slate-900)
  muted: "#64748b",          // axis labels / secondary text (slate-500)
  grid: "rgba(15,23,42,0.08)",
  // Categorical palette — indigo, violet, cyan, emerald, amber, rose, sky, lime.
  // Same hues as the dark version; chosen to read on a light canvas too.
  series: [
    "#6366f1", "#a855f7", "#06b6d4", "#10b981",
    "#f59e0b", "#f43f5e", "#0ea5e9", "#84cc16",
  ],
};

// Chart.js global defaults — typography, colours, grid lines.
Chart.defaults.color = THEME.muted;
Chart.defaults.font.family =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.borderColor = THEME.grid;
Chart.defaults.plugins.tooltip = {
  ...(Chart.defaults.plugins.tooltip ?? {}),
  backgroundColor: "rgba(15,23,42,0.92)",
  borderColor: "rgba(99,102,241,0.4)",
  borderWidth: 1,
  titleColor: "#f8fafc",
  bodyColor: "#e2e8f0",
  padding: 10,
  cornerRadius: 8,
  displayColors: true,
};
Chart.defaults.plugins.legend = {
  ...(Chart.defaults.plugins.legend ?? {}),
  labels: { color: THEME.fg, padding: 14, font: { size: 12 } },
};

/** Resolve fuel name to a brand colour (case-insensitive contains-match). */
function fuelColour(fuel: string): string {
  const u = fuel.toUpperCase();
  if (
    u === "BATTERY ELECTRIC" ||
    u === "FUEL CELL ELECTRIC" ||
    u === "RANGE EXTENDED ELECTRIC"
  )
    return "#10b981"; // emerald — clean energy
  if (u.includes("PLUG-IN HYBRID")) return "#8b5cf6"; // violet
  if (u.includes("HYBRID")) return "#06b6d4"; // cyan
  if (u === "PETROL") return "#f59e0b"; // amber
  if (u === "DIESEL") return "#64748b"; // slate
  if (u.includes("GAS")) return "#f43f5e"; // rose
  return "#94a3b8";
}

/** Build a vertical canvas gradient (top → bottom) for an area / bar fill. */
function makeGradient(
  ctx: CanvasRenderingContext2D,
  height: number,
  topRgba: string,
  bottomRgba: string
): CanvasGradient {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, topRgba);
  g.addColorStop(1, bottomRgba);
  return g;
}

/** Convert hex (#rrggbb) → rgba string with the given alpha. */
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h,
    16
  );
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

  const skipKeys = new Set<string>(["period_label", "year", "quarter"]);
  const ck = countKey(first);
  if (ck) skipKeys.add(ck);

  const seriesCandidates = Object.keys(first).filter((k) => !skipKeys.has(k));
  const seriesKey = seriesCandidates[0];

  const xLabels = [...new Set(capped.map(xLabel))];
  const seriesValues = seriesKey
    ? [...new Set(capped.map((r) => String(r[seriesKey] ?? "")))].slice(0, 8)
    : ["value"];

  const canvas = makeCanvas();
  getRoot().appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  const isFuelSeries = seriesKey === "fuel";

  const datasets = seriesValues.map((sv, i) => {
    const filtered = seriesKey
      ? capped.filter((r) => String(r[seriesKey] ?? "") === sv)
      : capped;
    const data = xLabels.map((xl) => {
      const row = filtered.find((r) => xLabel(r) === xl);
      if (!row || !ck) return null;
      return toNumber(row[ck]);
    });
    const colour = isFuelSeries ? fuelColour(sv) : THEME.series[i % THEME.series.length];
    const gradient = makeGradient(
      ctx,
      canvas.height || 400,
      withAlpha(colour, seriesValues.length === 1 ? 0.35 : 0.18),
      withAlpha(colour, 0)
    );
    return {
      label: sv,
      data,
      borderColor: colour,
      backgroundColor: gradient,
      borderWidth: 2.5,
      tension: 0.4,
      fill: seriesValues.length === 1,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: colour,
      pointHoverBorderColor: "#ffffff",
      pointHoverBorderWidth: 2,
    };
  });

  activeChart = new Chart(canvas, {
    type: "line",
    data: { labels: xLabels, datasets },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "bottom" } },
      scales: {
        x: { grid: { color: THEME.grid }, ticks: { color: THEME.muted } },
        y: { grid: { color: THEME.grid }, ticks: { color: THEME.muted }, beginAtZero: true },
      },
    },
  });
}

function renderBar(rows: Record<string, unknown>[]): void {
  const capped = rows.slice(0, 50);
  const ck = countKey(capped[0]) ?? "";
  const labels = capped.map((r) => String(r["make"] ?? ""));
  const data = capped.map((r) => toNumber(r[ck]) ?? 0);

  const canvas = makeCanvas();
  getRoot().appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  // Horizontal gradient: indigo → violet, left → right.
  const gradient = ctx.createLinearGradient(0, 0, canvas.width || 600, 0);
  gradient.addColorStop(0, "#6366f1");
  gradient.addColorStop(1, "#a855f7");

  activeChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: ck,
          data,
          backgroundColor: gradient,
          borderRadius: 6,
          borderSkipped: false,
          hoverBackgroundColor: "#c084fc",
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: THEME.grid }, ticks: { color: THEME.muted }, beginAtZero: true },
        y: { grid: { display: false }, ticks: { color: THEME.fg } },
      },
    },
  });
}

function renderDonut(rows: Record<string, unknown>[]): void {
  const capped = rows.slice(0, 12);
  const ck = countKey(capped[0]) ?? "";
  const labels = capped.map((r) => String(r["fuel"] ?? ""));
  const data = capped.map((r) => toNumber(r[ck]) ?? 0);
  const colours = labels.map(fuelColour);

  const canvas = makeCanvas();
  getRoot().appendChild(canvas);
  activeChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colours,
          borderColor: THEME.bg,
          borderWidth: 2,
          hoverOffset: 8,
          hoverBorderColor: THEME.fg,
        },
      ],
    },
    options: {
      responsive: true,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: THEME.fg, padding: 12, boxWidth: 12, boxHeight: 12 },
        },
      },
    },
  });
}

/** Rows above this threshold trigger incremental rAF-based table rendering. */
const PROGRESSIVE_THRESHOLD = 200;
/** Number of rows appended per animation frame in progressive mode. */
const CHUNK_SIZE = 150;

function renderTable(rows: Record<string, unknown>[]): void {
  const root = getRoot();
  if (!rows.length) {
    const p = document.createElement("p");
    p.textContent = "No data";
    p.style.cssText = `color:${THEME.muted};font-family:Inter,system-ui,sans-serif;padding:16px`;
    root.appendChild(p);
    return;
  }

  const headers = Object.keys(rows[0]);
  const wrap = document.createElement("div");
      wrap.style.cssText = "overflow:auto;border-radius:10px;border:1px solid rgba(15,23,42,0.08)";

  const table = document.createElement("table");
  table.style.cssText =
    "border-collapse:separate;border-spacing:0;width:100%;font-size:0.85rem;" +
    "font-family:Inter,system-ui,-apple-system,sans-serif;color:#0f172a;background:#ffffff";

  const thead = document.createElement("thead");
  const hr = document.createElement("tr");
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    th.style.cssText =
      "padding:10px 14px;background:#f1f5f9;color:#4338ca;text-align:left;" +
      "font-weight:600;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;" +
      "border-bottom:1px solid rgba(15,23,42,0.08)";
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  wrap.appendChild(table);
  root.appendChild(wrap);

  function appendChunk(startIndex: number): void {
    const end = Math.min(startIndex + CHUNK_SIZE, rows.length);
    for (let i = startIndex; i < end; i++) {
      const row = rows[i];
      const tr = document.createElement("tr");
      if (i % 2 === 1) tr.style.background = "rgba(99,102,241,0.04)";
      headers.forEach((h) => {
        const td = document.createElement("td");
        td.textContent = String(row[h] ?? "");
        td.style.cssText = "padding:8px 14px;border-bottom:1px solid rgba(15,23,42,0.05)";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
    if (end < rows.length) {
      requestAnimationFrame(() => appendChunk(end));
    }
  }

  if (rows.length > PROGRESSIVE_THRESHOLD) {
    // Large result sets: paint the first chunk immediately, then stream the
    // rest frame-by-frame so the browser stays responsive.
    appendChunk(0);
  } else {
    rows.forEach((row, i) => {
      const tr = document.createElement("tr");
      if (i % 2 === 1) tr.style.background = "rgba(99,102,241,0.04)";
      headers.forEach((h) => {
        const td = document.createElement("td");
        td.textContent = String(row[h] ?? "");
        td.style.cssText = "padding:8px 14px;border-bottom:1px solid rgba(15,23,42,0.05)";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }
}

// ---------------------------------------------------------------------------
// Host bridge — lets the renderer push follow-up user prompts into the chat
// (powers the suggestion chips below each chart). Wired in mcp-app.ts.
// ---------------------------------------------------------------------------

interface HostBridge {
  sendUserPrompt: (text: string) => Promise<void>;
}

let hostBridge: HostBridge | null = null;

export function setHostBridge(bridge: HostBridge): void {
  hostBridge = bridge;
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

  renderSuggestions(type, typed);
}

// ---------------------------------------------------------------------------
// Suggestion chips — quick follow-up prompts under each chart. Clicking one
// calls app.sendMessage() (via the host bridge) so the LLM picks it up as a
// new user turn and renders a fresh chart.
// ---------------------------------------------------------------------------

function suggestionsFor(type: ChartType, rows: Record<string, unknown>[]): string[] {
  if (!rows.length) return [];

  switch (type) {
    case "line":
      return [
        "Compare petrol vs diesel registrations over the same period",
        "Show the same trend grouped by body type",
        "Top 5 makes for the most recent quarter",
      ];
    case "bar": {
      const top = String(rows[0]?.["make"] ?? "").trim();
      return [
        top ? `Show the quarterly registration trend for ${top}` : "Show the quarterly registration trend for the leader",
        "Break down the top make by fuel type",
        "Compare the top 3 makes' EV share",
      ];
    }
    case "donut":
      return [
        "Show this fuel mix as a quarterly trend",
        "Limit to electric vehicles by make",
        "Compare 2024 vs 2019 fuel mix",
      ];
    default:
      return [
        "Top 10 makes by licensed registrations",
        "Fuel mix for the most recent year",
        "Quarterly trend of EV registrations",
      ];
  }
}

function renderSuggestions(type: ChartType, rows: Record<string, unknown>[]): void {
  const items = suggestionsFor(type, rows);
  if (!items.length || !hostBridge) return;

  const root = getRoot();
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "margin-top:14px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;" +
    "font-family:Inter,system-ui,-apple-system,sans-serif";

  const label = document.createElement("span");
  label.textContent = "Try next:";
  label.style.cssText =
    "font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;" +
    "color:#64748b;font-weight:600;margin-right:4px";
  wrap.appendChild(label);

  for (const text of items) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = text;
    btn.style.cssText =
      "padding:6px 12px;border-radius:999px;border:1px solid rgba(99,102,241,0.25);" +
      "background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(168,85,247,0.10));" +
      "color:#3730a3;font-size:0.8rem;font-weight:500;cursor:pointer;" +
      "font-family:inherit;transition:all 120ms ease";
    btn.addEventListener("mouseenter", () => {
      btn.style.background = "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(168,85,247,0.20))";
      btn.style.borderColor = "rgba(99,102,241,0.45)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = "linear-gradient(135deg,rgba(99,102,241,0.08),rgba(168,85,247,0.10))";
      btn.style.borderColor = "rgba(99,102,241,0.25)";
    });
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.style.opacity = "0.6";
      btn.style.cursor = "wait";
      try {
        await hostBridge?.sendUserPrompt(text);
      } catch (err) {
        console.error("[chart-renderer] suggestion send failed:", err);
        btn.disabled = false;
        btn.style.opacity = "";
        btn.style.cursor = "pointer";
      }
    });
    wrap.appendChild(btn);
  }

  root.appendChild(wrap);
}
