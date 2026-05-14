import sharedSystemPrompt from "../../../../shared/system-prompt.md?raw";

const DEMO_B_HEADER = `# Demo B (CopilotKit Static GenUI) — frontend tools

You have THREE frontend rendering tools available IN ADDITION to \`query_vehicles\`:
- \`show_fuel_breakdown({ panelId, title, data: { fuel, count, percentage }[] })\`
- \`show_trend({ panelId, title, series: { name, points: { x, y }[] }[] })\`
- \`show_top_makes({ panelId, title, data: { make, count }[] })\`

ALWAYS:
1. Use \`query_vehicles\` first to fetch the data with a SELECT against the allowed tables.
2. Then call exactly ONE of the show_* tools to render the result as a panel.
3. Use a stable \`panelId\` so repeat queries replace (not stack) panels — e.g. \`fuel-cars-2024\`.
4. Pick the chart kind that fits the question (donut for share, line for time, bar for ranking).

The rest of this prompt is shared with Demo A and describes the database.

---

`;

export const SYSTEM_PROMPT = DEMO_B_HEADER + sharedSystemPrompt;
