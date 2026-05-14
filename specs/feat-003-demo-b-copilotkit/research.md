# Research — Feature 003 (Demo B / CopilotKit)

## Dependency versions resolved

All versions are the latest stable on npm at the time of resolution
(via `npm view <pkg> version`). All meet or exceed the floors set by
Constitution Article IV.

| Package                      | Latest  | Article IV floor | Layer    |
| ---------------------------- | ------- | ---------------- | -------- |
| `@copilotkit/runtime`        | 1.57.1  | latest           | runtime  |
| `@copilotkit/react-core`     | 1.57.1  | latest           | frontend |
| `@copilotkit/react-ui`       | 1.57.1  | latest           | frontend |
| `@copilotkit/runtime-client-gql` | 1.57.1 | latest         | frontend |
| `react` / `react-dom`        | 19.2.6  | 19+              | frontend |
| `vite`                       | 8.0.11  | 6+               | frontend |
| `typescript`                 | 6.0.3   | 5.8+             | both     |
| `tailwindcss`                | 4.3.0   | v4               | frontend |
| `@tailwindcss/vite`          | 4.3.0   | v4               | frontend |
| `recharts`                   | 3.8.1   | 2.15+            | frontend |
| `pg`                         | 8.20.0  | latest           | runtime  |
| `lru-cache`                  | 11.3.6  | latest           | runtime  |
| `express`                    | 5.2.1   | latest           | runtime  |
| `cors`                       | 2.8.6   | latest           | runtime  |
| `dotenv`                     | 17.4.2  | latest           | both     |
| `tsx`                        | 4.21.0  | latest           | runtime  |

Notes:
- Vite 8 and TypeScript 6 are newer than the explicit floors in
  the constitution. No code-level reason to pin lower; latest stays.
- Tailwind v4 uses the new `@tailwindcss/vite` plugin (no
  `tailwind.config.js`/`postcss.config.js` needed).
- Recharts 3.x changed its package exports vs 2.x; chart components
  still import as named exports (`PieChart`, `LineChart`, `BarChart`).

## LLM provider / adapter

**Decision: Anthropic Claude (Sonnet 4.x) via `@copilotkit/runtime`'s
built-in `AnthropicAdapter`.**

Rationale:
- Demo A is exercised through Claude Desktop. Using the same model
  family for Demo B isolates the GenUI-pattern variable in the
  comparison; we are not also comparing OpenAI vs Anthropic SQL
  authoring quality.
- `@copilotkit/runtime` ships first-class adapters for OpenAI,
  Anthropic, Groq, and Google. Anthropic adapter is stable.
- Required env: `ANTHROPIC_API_KEY` on the runtime process. Documented
  in `src/demo-b-copilotkit/runtime/.env.example`.

Rejected:
- **OpenAI adapter** — would introduce a model-quality confounding
  variable in the comparison.
- **CopilotCloud-hosted** — requires sending traffic through
  CopilotKit's cloud; the constitution constrains the PoC to local
  PoC use, and we want explicit control over the LLM call surface.

## CopilotKit Runtime hosting

**Decision: standalone Node + Express server at
`src/demo-b-copilotkit/runtime/`, exposing `POST /api/copilotkit`.**

Rationale:
- Frontend is a Vite SPA. CopilotKit's documented Vite recipe is
  exactly this: a separate Express endpoint that the SPA calls via
  `runtimeUrl`. Co-locating in a Next.js API route would force a
  framework change.
- Two separate dev processes (`pnpm dev` for frontend, `pnpm start`
  for runtime) match Demo A's two-process model (server + Claude
  Desktop) — symmetrical operator experience for the comparison doc.
- One Node process owning the LLM adapter, the `pg` pool, the LRU
  cache, and the `query_vehicles` action keeps the runtime trivially
  inspectable.

Rejected:
- **Vite middleware mode** — couples runtime to frontend dev server;
  ungainly for production-style demos.
- **Next.js full-stack** — heavyweight; constitution does not list
  Next.js as part of the stack.

## Schema-prompt strategy

**Decision: runtime `pg_catalog` introspection via the same
`query_vehicles` tool — identical to Demo A.**

The Demo A `system-prompt.md` is the source of truth. Demo B's
`useCopilotReadable` will load that same file's content (or a
minimally adapted variant explaining the three frontend tools)
and inject it as system context.

Rationale:
- Constitution Article III v1.1.0 mandates that `COMMENT ON` is the
  only prompt-engineering surface. Hardcoding tables/columns in
  `useCopilotReadable` would re-create that surface client-side.
- Identical introspection behaviour across demos = fair comparison
  on prompt-engineering ergonomics.

## CORS

Frontend dev server runs at `http://localhost:5173`; runtime at
`http://localhost:4001`. The runtime allows CORS from
`http://localhost:5173` only (env-overrideable for the
cloudflared/ngrok testing pattern Demo A established).

## LRU cache

`lru-cache` v11 — Node ESM. Wrap `pg.query` in the action handler:
`max: 200`, `ttl: 1000 * 60 * 60`. Returns
`{ rows, cached: boolean }` so the comparison doc can show
cache-hit telemetry. No SQL normalisation; raw trimmed string keys.

## Outstanding unknowns

None. All [NEEDS CLARIFICATION] items from spec.md were resolved
implicitly during this research:
- Runtime hosting → standalone Express.
- LLM provider → Anthropic.
- Schema-prompt strategy → runtime introspection (same as Demo A).
