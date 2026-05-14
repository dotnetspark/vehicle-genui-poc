import { CopilotRuntime, BuiltInAgent, defineTool } from "@copilotkit/runtime/v2";
import { createCopilotExpressHandler } from "@copilotkit/runtime/v2/express";
import { z } from "zod";
import { queryVehicles } from "./actions/queryVehicles.js";

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "anthropic/claude-sonnet-4.5";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("[copilotkit] WARNING: ANTHROPIC_API_KEY is not set; chat will fail at request time.");
}

const queryVehiclesTool = defineTool({
  name: "query_vehicles",
  description:
    "Execute a single read-only SELECT query against the UK DVLA vehicles database (Postgres). " +
    "Use pg_catalog and information_schema to introspect the schema, and read COMMENT ON metadata for column semantics. " +
    "Allowed tables: dim_vehicle, dim_period, fact_registrations, v_schema_summary. " +
    "Returns rows as a JSON array. Results are LRU-cached for 1h keyed by SQL string.",
  parameters: z.object({
    sql: z.string().describe("A single SELECT statement. Must not modify data; the role is enforced read-only."),
  }),
  execute: async ({ sql }) => {
    console.log("[query_vehicles] sql=", sql.replace(/\s+/g, " ").slice(0, 120));
    const result = await queryVehicles({ sql });
    console.log("[query_vehicles] rows=", result.rows.length, "cached=", result.cached);
    return result;
  },
});

const defaultAgent = new BuiltInAgent({
  model: ANTHROPIC_MODEL,
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxSteps: 10,
  tools: [queryVehiclesTool],
});

const runtime = new CopilotRuntime({
  agents: { default: defaultAgent },
});

export const COPILOTKIT_ENDPOINT = "/api/copilotkit";

export function mountCopilotKit(app: import("express").Express): void {
  const router = createCopilotExpressHandler({
    runtime,
    basePath: COPILOTKIT_ENDPOINT,
  });
  app.use(router);
}
