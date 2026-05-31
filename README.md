# Finance Tracker MCP

AI-facing adapter service for Finance Tracker.

The MCP service calls `finance-tracker-api` and never imports API internals or writes directly to the database.

## Local Dev

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Default URL:

```text
http://localhost:4100
```

## Environment

- `PORT`: HTTP port, default `4100`.
- `FINTRACK_API_BASE_URL`: Finance Tracker API base URL.
- `FINTRACK_API_SERVICE_TOKEN`: service-to-service credential when enabled by API.
- `LOG_LEVEL`: pino log level.

## Health

- `GET /health`: process liveness.
- `GET /ready`: checks Finance Tracker API health.
- `GET /mcp/catalog`: temporary catalog of planned MCP resources/tools.
