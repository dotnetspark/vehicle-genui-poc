# Prompt 3 — Feature 002: Demo A — MCP Apps (Milestone v0.2.0)

> Feed this to Claude Code after Prompt 2 is complete and v0.1.0 is tagged.
> This covers Roadmap items R5–R8 (Milestone v0.2.0).

---

## Context

Demo A has no custom agent and no custom query tools. The standard `mcp-postgres` MCP server
connects directly to Postgres. A thin FastMCP wrapper adds `ui://` HTML resource declarations
following SEP-1865. Claude, inside Claude Desktop, reads the schema cold, writes SQL, executes
it via mcp-postgres tools, and the host renders the matching `ui://` HTML asset in a sandboxed
iframe. The developer writes only the schema (done) and the HTML chart assets.

## Step 1 — Create GitHub Issues

- #5: feat: FastMCP wrapper — proxy mcp-postgres + ui:// resource declarations
- #6: feat: HTML chart assets — fuel donut, trend line, top makes bar
- #7: feat: Claude Desktop config and system prompt
- #8: chore: Demo A end-to-end test — all five example queries

## Step 2 — Run /speckit.specify

```
/speckit.specify

Feature 002 — Demo A: MCP Apps Surface

Build the MCP Apps demo surface. This consists of:

1. A FastMCP wrapper server (src/demo-a-mcp-apps/server.py) that:
   - Proxies all tools from the standard mcp-postgres MCP server
   - Declares three ui:// resources per SEP-1865:
       ui://vehicle/fuel-breakdown  (text/html;profile=mcp-app)
       ui://vehicle/trend-chart     (text/html;profile=mcp-app)
       ui://vehicle/top-makes       (text/html;profile=mcp-app)
   - Intercepts tool responses and adds _meta["ui/resourceUri"] based on query type:
       fuel aggregations → ui://vehicle/fuel-breakdown
       time-based GROUP BY → ui://vehicle/trend-chart
       make/model rankings → ui://vehicle/top-makes
       default fallback → ui://vehicle/trend-chart

2. Three self-contained HTML chart assets (src/demo-a-mcp-apps/ui/):
   - fuel_breakdown.html: Chart.js 4 donut chart, receives data via postMessage
     { type: "data", payload: [{fuel, count, percentage}] }
     Colour mapping: green for electric, blue for hybrid, grey for ICE, amber for gas
   - trend_chart.html: Chart.js 4 line/area chart
     Payload: [{period_label, count}] or [{period_label, count, series}] for multi-series
     Y axis: abbreviated K/M
   - top_makes.html: Chart.js 4 horizontal bar chart
     Payload: [{make, count, rank}]
     Rank shown left of bar, sequential animation on load

3. Claude Desktop config (src/demo-a-mcp-apps/claude-desktop-config.json)
4. System prompt (src/demo-a-mcp-apps/system-prompt.md)

All files in src/demo-a-mcp-apps/. No custom query tools. No custom agent.
Closes #5, #6, #7.
```

## Step 3 — Run /speckit.plan

```
/speckit.plan

Research latest stable versions:
- fastmcp (pip)
- mcp-postgres package or npx command
- Chart.js 4 CDN URL

The wrapper must run on stdio transport for Claude Desktop compatibility.
The HTML assets must work offline once loaded (Chart.js from CDN, no other deps).
The postMessage data binding must be testable from the browser console.
```

## Step 4 — Run /speckit.tasks + /speckit.analyze

```
/speckit.tasks
/speckit.analyze
```

## Step 5 — Run /speckit.implement

```
/speckit.implement

Priority sequence:
1. src/demo-a-mcp-apps/server.py
2. src/demo-a-mcp-apps/requirements.txt
3. src/demo-a-mcp-apps/ui/fuel_breakdown.html
   — After creating, open in browser and run in console:
     window.postMessage({type:"data",payload:[{fuel:"BATTERY ELECTRIC",count:847234,percentage:12.3},{fuel:"PETROL",count:3200000,percentage:45.1},{fuel:"DIESEL",count:2800000,percentage:39.5},{fuel:"HYBRID ELECTRIC (PETROL)",count:220000,percentage:3.1}]}, "*")
   — Verify chart renders before proceeding
4. src/demo-a-mcp-apps/ui/trend_chart.html — same postMessage test
5. src/demo-a-mcp-apps/ui/top_makes.html — same postMessage test
6. src/demo-a-mcp-apps/claude-desktop-config.json
7. src/demo-a-mcp-apps/system-prompt.md
8. CHANGELOG.md entry, ROADMAP.md v0.2.0 items R5-R7 marked done
```

## Step 6 — End-to-end test (#8)

Manual verification checklist — run all five queries in Claude Desktop:
- [ ] "Fuel breakdown for Cars in 2024" → donut chart renders
- [ ] "EV growth trend since 2015" → line chart renders
- [ ] "Top 10 makes by licensed vehicles" → bar chart renders
- [ ] "Licensed vs SORN for motorcycles over time" → line chart renders
- [ ] "Which fuel type grew fastest in the last 5 years?" → chart renders

Mark R8 done in ROADMAP.md after all five pass.

## Step 7 — Tag the milestone

```bash
git add .
git commit -m "feat(002): Demo A MCP Apps surface — closes #5 #6 #7 #8"
git tag v0.2.0
```
