import "dotenv/config";
import express from "express";
import cors from "cors";
import { verifyRoleHardening } from "./verify-role.js";
import { mountCopilotKit, COPILOTKIT_ENDPOINT } from "./copilotkit.js";

async function main() {
  await verifyRoleHardening();

  const app = express();
  app.use(cors({ origin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173" }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  mountCopilotKit(app);

  const port = Number(process.env.PORT ?? 4001);
  app.listen(port, () => {
    console.log(`[runtime] listening on http://localhost:${port}`);
    console.log(`[runtime] copilotkit endpoint: ${COPILOTKIT_ENDPOINT}`);
  });
}

main().catch((err) => {
  console.error("[runtime] fatal:", err);
  process.exit(1);
});
