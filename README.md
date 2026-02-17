# Fish & Money Workspace

Monorepo with 2 services:
- `@fishmoney/frontend` (`apps/frontend`) - Vite + React SPA
- `@fishmoney/backend` (`apps/backend`) - Express API
- `@fishmoney/shared` (`packages/shared`) - shared zod contracts/types

## API contract

Main endpoint is unchanged:
- `POST /api/analyze`
  - request: `{ "ticker": "AAPL" }`
  - responses: same schemas as before (`200`, `400`, `500`)

Additional endpoint:
- `GET /api/health`

## Environment variables

Backend (`apps/backend/.env`):
- `PORT` (default `5000`)
- `DATABASE_URL` (required)
- `N8N_WEBHOOK_URL` (required)
- `CORS_ORIGINS` (comma-separated, default `http://localhost:5173`)

Frontend (`apps/frontend/.env`):
- `VITE_API_BASE_URL` (default fallback in code: `http://localhost:5000`)

## Scripts (root)

- `npm run dev` - run backend + frontend in parallel
- `npm run build` - build shared, then backend, then frontend
- `npm run start` - run backend production server
- `npm run check` - run type checks in all workspaces
- `npm run db:push` - run Drizzle push for backend

## Production split

- Deploy `apps/frontend` as static build (`npm run build -w @fishmoney/frontend`)
- Deploy `apps/backend` as API service (`npm run build -w @fishmoney/backend && npm run start -w @fishmoney/backend`)
- Set `VITE_API_BASE_URL` in frontend build env to backend API domain
- Set `CORS_ORIGINS` in backend env to frontend domain(s)
