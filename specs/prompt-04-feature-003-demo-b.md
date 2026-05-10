# Prompt 4 — Feature 003: Demo B — CopilotKit + AG-UI (Milestone v0.3.0)

> Feed this to Claude Code after Prompt 3 is complete and v0.2.0 is tagged.
> This covers Roadmap items R9–R12 (Milestone v0.3.0).

---

## Context

Demo B has no custom agent and no custom query tools. CopilotKit connects directly to the
standard `mcp-postgres` MCP server via `McpServerManager`. The developer registers pre-built
React chart components via `useFrontendTool`. Claude writes SQL via mcp-postgres tools, gets
results, and calls registered frontend tools to render charts. The developer writes only the
React components.

## Step 1 — Create GitHub Issues

- #9: feat: Vite + React dashboard scaffold with McpServerManager
- #10: feat: useFrontendTool registrations (show_fuel_breakdown, show_trend, show_top_makes)
- #11: feat: Dashboard-first layout — no persistent chat window on load
- #12: chore: Demo B end-to-end test — all five example query chips

## Step 2 — Run /speckit.specify

```
/speckit.specify

Feature 003 — Demo B: CopilotKit Static GenUI Dashboard

Build the CopilotKit dashboard demo. This consists of:

1. Vite 6 + React 19 + TypeScript 5.8+ app at src/demo-b-copilotkit/frontend/
   Package manager: pnpm
   Styling: Tailwind CSS v4
   Charts: Recharts 2.15+
   CopilotKit: @copilotkit/react-core + @copilotkit/react-ui (latest)

2. CopilotKit setup (src/demo-b-copilotkit/frontend/src/App.tsx):
   - CopilotKit provider with publicApiKey from env
   - McpServerManager connecting to mcp-postgres SSE endpoint
   - CopilotTools component mounted inside provider
   - Dashboard component

3. Three useFrontendTool registrations (src/demo-b-copilotkit/frontend/src/copilot/tools.tsx):
   - show_fuel_breakdown: renders FuelBreakdownChart (Recharts PieChart/donut)
   - show_trend: renders TrendChart (Recharts LineChart with area)
   - show_top_makes: renders TopMakesTable (Recharts BarChart horizontal)
   Each tool renders into a dashboard panel grid by panel ID (replaces, not stacks)
   Each tool shows ChartSkeleton while status === "inProgress"

4. Dashboard layout (no persistent chat window):
   - Top: single text input, placeholder "Ask about UK vehicle registrations..."
   - Below: horizontally scrollable row of 5 example query chips
   - Main: 12-column CSS grid, panels snap to 4/6/8/12 col widths by chart type
   - Floating bottom-right: CopilotPopup toggle (collapsed by default)
   - "Agent is working..." spinner during tool execution

5. System prompt injected via useCopilotReadable:
   - Schema description
   - Join rules
   - Tool routing instructions (show_fuel_breakdown / show_trend / show_top_makes)
   - "Never return raw query results as plain text"

All files in src/demo-b-copilotkit/frontend/src/.
No custom backend. No custom query tools. No agent process.
Closes #9, #10, #11.
```

## Step 3 — Run /speckit.plan

```
/speckit.plan

Research latest stable versions:
- @copilotkit/react-core
- @copilotkit/react-ui
- vite
- react + react-dom
- typescript
- tailwindcss v4
- recharts
- zod (for useFrontendTool parameter schemas)
- pnpm

The McpServerManager must point to mcp-postgres running in SSE mode.
Document in research.md how to start mcp-postgres in SSE mode.

The React components must be verified with hardcoded sample data props first,
before wiring CopilotKit, to confirm rendering is correct.
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
1. src/demo-b-copilotkit/frontend/package.json (pnpm init, add all deps)
2. src/demo-b-copilotkit/frontend/vite.config.ts
3. src/demo-b-copilotkit/frontend/src/components/ChartSkeleton.tsx
4. src/demo-b-copilotkit/frontend/src/components/FuelBreakdownChart.tsx
   — Hardcode sample data: [{fuel:"BATTERY ELECTRIC",count:847234,percentage:12.3}, ...]
   — pnpm dev, verify renders correctly
5. src/demo-b-copilotkit/frontend/src/components/TrendChart.tsx — same hardcode test
6. src/demo-b-copilotkit/frontend/src/components/TopMakesTable.tsx — same hardcode test
7. src/demo-b-copilotkit/frontend/src/hooks/useDashboard.ts
8. src/demo-b-copilotkit/frontend/src/components/DashboardGrid.tsx
9. src/demo-b-copilotkit/frontend/src/copilot/tools.tsx (useFrontendTool registrations)
10. src/demo-b-copilotkit/frontend/src/App.tsx (CopilotKit + McpServerManager)
11. src/demo-b-copilotkit/frontend/.env.example
12. CHANGELOG.md entry, ROADMAP.md v0.3.0 items R9-R11 marked done
```

## Step 6 — End-to-end test (#12)

Manual verification checklist — run all five query chips in the browser:
- [ ] "Fuel breakdown for Cars in 2024" → donut chart panel appears
- [ ] "EV growth trend since 2015" → line chart panel appears
- [ ] "Top 10 makes by licensed vehicles" → bar chart panel appears
- [ ] "Licensed vs SORN for motorcycles over time" → line chart panel appears
- [ ] "Which fuel type grew fastest in the last 5 years?" → chart panel appears

Mark R12 done in ROADMAP.md after all five pass.

## Step 7 — Tag the milestone

```bash
git add .
git commit -m "feat(003): Demo B CopilotKit AG-UI dashboard — closes #9 #10 #11 #12"
git tag v0.3.0
```
