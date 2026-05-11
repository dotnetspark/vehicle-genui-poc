import {
  CopilotRuntime,
  AnthropicAdapter,
  copilotRuntimeNodeExpressEndpoint,
} from "@copilotkit/runtime";
import Anthropic from "@anthropic-ai/sdk";
import type { Request, Response } from "express";
import { queryVehicles } from "./actions/queryVehicles.js";

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("[copilotkit] WARNING: ANTHROPIC_API_KEY is not set; chat will fail at request time.");
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const serviceAdapter = new AnthropicAdapter({ anthropic, model: ANTHROPIC_MODEL });

const runtime = new CopilotRuntime({
  actions: () => [
    {
      name: "query_vehicles",
      description:
        "Execute a single read-only SELECT query against the UK DVLA vehicles database (Postgres). " +
        "Use pg_catalog and information_schema to introspect the schema, and read COMMENT ON metadata for column semantics. " +
        "Allowed tables: dim_vehicle, dim_period, fact_registrations, v_schema_summary. " +
        "Returns rows as a JSON array. Results are LRU-cached for 1h keyed by SQL string.",
      parameters: [
        {
          name: "sql",
          type: "string",
          description: "A single SELECT statement. Must not modify data; the role is enforced read-only.",
          required: true,
        },
      ],
      handler: async ({ sql }: { sql: string }) => {
        const result = await queryVehicles({ sql });
        return result;
      },
    },
  ],
});

export const COPILOTKIT_ENDPOINT = "/api/copilotkit";

export function mountCopilotKit(app: import("express").Express): void {
  const handler = copilotRuntimeNodeExpressEndpoint({
    endpoint: COPILOTKIT_ENDPOINT,
    runtime,
    serviceAdapter,
  });
  app.use(COPILOTKIT_ENDPOINT, (req: Request, res: Response) => {
    return handler(req, res);
  });
}
