# Project Context

- **Owner:** Yadel Lopez
- **Project:** vehicle-genui-poc — generative UI comparison PoC. I own the rendering surfaces for both demos.
- **Stack:** Vite 6 + `vite-plugin-singlefile` 2.3.2 + Chart.js 4.5.1 (Demo A); React 19 + TypeScript 5.8 + Tailwind v4 + Recharts 2.15+ + CopilotKit (Demo B, future)
- **Created:** 2026-05-08

## Learnings

- Demo A's HTML is a single-file Chart.js page bundled by Vite. Build command: `INPUT=mcp-app.html vite build` (cross-env wired for Windows). Output: `dist/mcp-app.html`.
- Phase 1 placeholder `mcp-app.html` exists; the real chart UI is built in Feature 002 Phase 3 (post-server).
- Article VI: all diagrams in README/docs/specs use Mermaid. No ASCII. No image files for diagrams.
