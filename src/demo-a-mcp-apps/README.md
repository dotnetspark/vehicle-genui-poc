# Demo A — MCP Apps

Demo A is an **MCP Apps** (SEP-1865) server that exposes a single `query_vehicles` tool and a
bundled Chart.js UI rendered as a sandboxed iframe inside Claude Desktop. It connects to the
shared PostgreSQL 16 database of UK vehicle registration data (DVLA VEH0120) via a read-only
role. Claude writes all SQL itself after inspecting the schema through `pg_catalog`; this demo
provides no query templates and no hard-coded charts.

---

## Prerequisites

- **Feature 001 (ETL) must be complete.** The database schema must exist and at least one ETL
  run must have loaded data. See the [root README Quick Start](../../README.md#quick-start) for
  steps 1–5.
- **Postgres container running.** From the repo root:
  ```
  docker compose up -d
  ```
  Confirm `vehicle-agui-poc-db-1` is healthy before proceeding.
- **Node.js 22 LTS** and **npm** available on your PATH.

---

## One-time setup — read-only role

Apply `setup-readonly-role.sql` to create the `vehicles_readonly` Postgres role. The script is
idempotent — safe to re-run.

**Windows (PowerShell):**
```
Get-Content src/demo-a-mcp-apps/setup-readonly-role.sql | docker exec -i vehicle-agui-poc-db-1 psql -U postgres -d vehicles
```

**macOS / Linux (bash):**
```
cat src/demo-a-mcp-apps/setup-readonly-role.sql | docker exec -i vehicle-agui-poc-db-1 psql -U postgres -d vehicles
```

Run these commands from the **repo root**.

---

## Run the server

```
cd src/demo-a-mcp-apps
npm install
npm run build
npm run serve
```

The server starts on `http://localhost:3001/mcp`. You should see a line such as:

```
Demo A MCP server listening on http://localhost:3001/mcp
```

Leave this terminal open; Claude Desktop connects to it on demand.

---

## Wire up Claude Desktop

### 1. Install `mcp-remote` globally (one-time, recommended on Windows)

Claude Desktop allows ~60 seconds for an MCP server to initialise. The first time
`npx mcp-remote` runs it must download the package, which can exceed that limit
and cause "Could not attach to MCP server" errors. Pre-install it:

```
npm install -g mcp-remote
```

### 2. Locate (or create) the Claude Desktop config file

| Platform                                     | Path                                                                                                  |
|----------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Windows — standalone .exe (claude.ai/download) | `%APPDATA%\Claude\claude_desktop_config.json`                                                         |
| Windows — Microsoft Store / MSIX build       | `%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\claude_desktop_config.json`   |
| macOS                                        | `~/Library/Application Support/Claude/claude_desktop_config.json`                                     |

The MSIX build runs in an AppContainer sandbox that redirects `%APPDATA%` to a
per-package `LocalCache\Roaming\` folder. If you cannot tell which build you have,
check **Settings → About** — MSIX shows a version like `1.7196.0.0`. If the file
does not exist at the appropriate path, create it with the contents `{}`.

### 3. Merge the MCP server entry

Open your `claude_desktop_config.json` and merge in the `mcpServers` block. Your file should
contain at minimum:

```json
{
  "mcpServers": {
    "vehicle-genui-demo-a": {
      "command": "npx.cmd",
      "args": ["mcp-remote", "http://localhost:3001/mcp"]
    }
  }
}
```

> **Windows quirk:** Claude Desktop spawns commands directly without a shell, so the
> `.cmd` extension is required (`npx.cmd`, not `npx`). On macOS / Linux use plain `npx`.

If you already have other entries under `mcpServers`, keep them — only add the
`vehicle-genui-demo-a` key.

The full snippet is also available in [`claude-desktop-config.json`](./claude-desktop-config.json)
in this directory.

### 4. Set the system prompt

Open **Claude Desktop → Settings → Profile → Custom instructions** and paste the full contents
of [`system-prompt.md`](../shared/system-prompt.md) (shared with Demo B) into the field. This is a
user-level setting that applies across all conversations.

The prompt instructs Claude to inspect the schema via `pg_catalog` before writing any analytical
SQL, and tells it how the chart renderer selects a chart type from column names.

### 5. Restart Claude Desktop

Quit Claude Desktop completely — use the tray icon **Quit** (not just close the window) — then
relaunch it. The MCP server registration only takes effect after a full restart.

---

## Alternative — remote testing via cloudflared (Claude.ai web / Connectors)

If you do not have Claude Desktop installed, or you want to test from Claude.ai web (Custom
Connectors) or share the demo with someone else, expose the local server via a Cloudflare quick
tunnel. This pattern follows Den Delimarsky's recommended approach for testing remote MCP
servers.

### 1. Install cloudflared (one-time)

```
winget install --id Cloudflare.cloudflared
```

macOS / Linux: see [Cloudflare's install docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).

### 2. Start the tunnel

With the MCP server running on port 3001, in a **separate** terminal:

```
cloudflared tunnel --url http://localhost:3001
```

Cloudflared prints a public HTTPS URL such as:

```
https://lisa-stretch-all-notices.trycloudflare.com
```

The MCP endpoint is `<that-url>/mcp`. Quick tunnels are anonymous and ephemeral — the URL
changes every time you restart `cloudflared`.

### 3a. Use with Claude.ai web (Custom Connectors)

In Claude.ai → **Settings → Connectors → Add custom connector**, paste the tunnel URL with
`/mcp` appended, e.g. `https://lisa-stretch-all-notices.trycloudflare.com/mcp`. Save and enable
the connector for the chat. Then paste `../shared/system-prompt.md` into Project / Custom instructions.

### 3b. Use with Claude Desktop (without `mcp-remote` shim)

Replace the `mcpServers` entry in `claude_desktop_config.json` with the remote URL form (no
stdio bridge needed):

```json
{
  "mcpServers": {
    "vehicle-genui-demo-a": {
      "url": "https://lisa-stretch-all-notices.trycloudflare.com/mcp"
    }
  }
}
```

Then fully quit and restart Claude Desktop.

---

## Try it

With the server running and Claude Desktop restarted, ask any of these five golden-path
questions and watch the chart render in the conversation:

1. "Fuel breakdown for Cars in 2024"
2. "EV growth trend since 2015"
3. "Top 10 makes by licensed vehicles"
4. "Licensed vs SORN for motorcycles over time"
5. "Which fuel type grew fastest in the last 5 years?"

Claude will call `query_vehicles` one or more times (schema introspection, then the analytical
query), and the result rows will appear as an interactive chart inside the conversation window.

---

## Troubleshooting

**Server is not listening on port 3001**
Another process may be using the port. Check with `netstat -ano | findstr 3001` (Windows) or
`lsof -i :3001` (macOS/Linux) and stop the conflicting process, or change `PORT` in your `.env`.

**Claude Desktop doesn't see the `query_vehicles` tool**
Verify your `claude_desktop_config.json` is valid JSON (paste it into a JSON validator). Then
confirm you did a full quit-and-restart of Claude Desktop, not just a window close. On the
Microsoft Store / MSIX build, make sure you edited the **sandbox** copy of the config under
`%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\` — edits to the
plain `%APPDATA%\Claude\` path are silently ignored by that build.

**"Could not attach to MCP server vehicle-genui-demo-a" in Claude Desktop logs**
Almost always caused by `npx mcp-remote` cold-downloading the package and exceeding the
60-second initialisation budget. Run `npm install -g mcp-remote` and restart Claude Desktop.
Logs for the MSIX build live at
`%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\logs\` (`mcp.log`
and `mcp-server-vehicle-genui-demo-a.log`).

**`permission denied` on a SELECT**
Two possible causes: (a) the read-only role SQL was not applied — re-run the one-time setup step
above; (b) `DATABASE_URL_READONLY` in `.env` is not set or points to the wrong credentials.

**Blank chart / no chart appears**
Open the browser DevTools console. The iframe URL follows the pattern
`ui://vehicle/chart-renderer/mcp-app.v3.html` — navigate directly to the served HTML at
`http://localhost:3001` (if the server exposes a static route) and check for JavaScript errors.
Ensure the result rows contain the column names the renderer expects (see `../shared/system-prompt.md`
§ Rendering contract).
