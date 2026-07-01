# Repository Guidelines

## Project Structure & Module Organization

Monorepo with two independent projects:

- `backend/` — Express + TypeScript API server with SQLite and Socket.IO
- `frontend/` — React 19 + Vite 6 + TypeScript + Tailwind CSS v4 SPA

Backend source (`backend/src/`):

- `index.ts` — Express entrypoint, middleware, route mounting
- `db.ts` — SQLite schema (keywords, hot_spots, notifications, historical_volume, config)
- `swagger.ts` — OpenAPI 3.0 spec generation via swagger-jsdoc
- `routes/` — `overview.ts`, `keywords.ts`, `hotspots.ts`, `config.ts`, `scrape.ts`
- `services/` — `scraper.ts`, `deepseek.ts`, `scheduler.ts`, `mailer.ts`, `trends.ts`
- `sources/` — `types.ts`, `web-search.ts`, `twitter.ts`, `collector.ts`
- `socket.ts` — Socket.IO for real-time push notifications

Frontend source (`frontend/src/`):

- `main.tsx` / `App.tsx` — Entry with useState-based view routing
- `components/` — `Header.tsx`, `Sidebar.tsx`, `KpiCards.tsx`, `TrendChart.tsx`, `CategoryChart.tsx`, `HotspotTable.tsx`, `KeywordManager.tsx`, `NotificationSettings.tsx`
- `mockData.ts` — Hardcoded demo data
- `types.ts` — Shared TypeScript interfaces

## Build, Test, and Development Commands

```
cd backend && npm run dev   # port 3001
cd frontend && npm run dev  # port 5199, standalone
```

| Command         | Where       | Purpose                       |
| --------------- | ----------- | ----------------------------- |
| `npm run dev`   | `backend/`  | Hot-reload via `tsx watch`    |
| `npm run build` | `backend/`  | Compile TypeScript to `dist/` |
| `npm run dev`   | `frontend/` | Vite dev server on port 5199  |
| `npm run build` | `frontend/` | Type-check + production build |
| `npm run lint`  | `frontend/` | `tsc --noEmit` type check     |

## API Documentation

Swagger UI: `http://localhost:3001/api-docs`

- **Config**: `backend/src/swagger.ts` — OpenAPI 3.0 + swagger-jsdoc
- **Annotations**: JSDoc `@swagger` blocks in every route file
- **Mount**: `swagger-ui-express` in `index.ts`

## Architecture Overview

Three-view SPA (overview / keywords / notifications) with Express backend and Socket.IO.

### Data Pipeline (Multi-Source + AI)

```
scheduler.ts (cron: every 30 min)
     │
     ▼
scraper.ts → collectAllKeywords()
     │
     ▼
collector.ts → collectFromAllSources()
     ├── web-search.ts   → DuckDuckGo HTML (↘ Bing fallback)
     ├── twitter.ts      → twitterapi.io tweets
     └── parallel, Promise.allSettled
     │
     ▼ (dedup by normalized title)
     │
     ▼
deepseek.ts → verifyContentAuthenticity()
deepseek.ts → analyzeHotSpots()
     │
     ▼
SQLite → Socket.IO push → email alerts (Nodemailer + QQ SMTP)
```

### Pipeline Steps

1. `scheduler.ts` triggers collection every 30 min; trend calc daily at 2 AM
2. `collector.ts` queries all configured sources in parallel
3. `scraper.ts` feeds real data to DeepSeek AI for authenticity verification + scoring
4. Results stored in SQLite; historical volume recorded
5. Hotspots broadcast via Socket.IO; email alerts via Nodemailer

### Adding a New Data Source

Implement `SourceAdapter` in `sources/types.ts`:

```ts
interface SourceAdapter {
  readonly name: string;
  fetchResults(keyword: string, scope?: string): Promise<RawSearchResult[]>;
}
```

Register in `sources/collector.ts`:

```ts
const SOURCES: SourceAdapter[] = [
  webSearchAdapter,
  twitterAdapter,
  newSourceAdapter, // ← add here
];
```

### Database Migration

Schema changes use idempotent `migrateAddColumn()` in `db.ts`. New columns are added to `CREATE TABLE IF NOT EXISTS` DDL and also checked via `PRAGMA table_info` before ALTER for existing databases.

### Key Dependencies

**Backend**: `express`, `better-sqlite3`, `socket.io`, `node-cron`, `nodemailer`, `axios`, `cheerio`, `swagger-jsdoc`, `swagger-ui-express`

**Frontend**: `react` 19, `vite` 6, `tailwindcss` v4, `recharts`, `lucide-react`, `motion`

## Design System

## Coding Style

- TypeScript strict mode
- Components: PascalCase, named exports (`export function Header`)
- API shapes: `snake_case`; Socket.IO payloads: `camelCase`
- Indentation: 2 spaces
- UI labels in Chinese

## Rate Limiting & Anti-Blocking

| Source                               | Strategy                                                             |
| ------------------------------------ | -------------------------------------------------------------------- |
| Web Search (`sources/web-search.ts`) | ≥3s between requests, random UA rotation, DuckDuckGo → Bing fallback |
| Twitter API (`sources/twitter.ts`)   | ≥2s between requests, handles 401/403/429 gracefully                 |

All source failures are isolated via `Promise.allSettled`.

## Environment

```bash
cp backend/.env.example backend/.env
```

| Variable            | Default                     | Description                  |
| ------------------- | --------------------------- | ---------------------------- |
| `DEEPSEEK_API_KEY`  | —                           | DeepSeek AI key (required)   |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com`  | API endpoint                 |
| `PORT`              | `3001`                      | Backend server port          |
| `FRONTEND_URL`      | `http://localhost:5173`     | CORS origin                  |
| `TWITTER_API_KEY`   | —                           | twitterapi.io key (optional) |
| `TWITTER_API_BASE`  | `https://twitterapi.io/api` | API endpoint                 |

## Database

SQLite (WAL mode): `keywords`, `hot_spots` (with category/platform/trend/sentiment fields), `notifications`, `historical_volume` (30-day stats), `config` (key-value settings).

**Foreign key enforcement**: `better-sqlite3` v11.x enables `PRAGMA foreign_keys = ON` by default. This is explicitly set in `db.ts` for clarity. All child records must be deleted before their parent — always wrap multi-table mutations in `db.transaction()`. The FK relationships are:

| Child Table         | FK Column     | Parent Table    |
| ------------------- | ------------- | --------------- |
| `hot_spots`         | `keyword_id`  | `keywords(id)`  |
| `notifications`     | `keyword_id`  | `keywords(id)`  |
| `notifications`     | `hot_spot_id` | `hot_spots(id)` |
| `historical_volume` | `keyword_id`  | `keywords(id)`  |

When deleting a keyword, also delete from: `notifications`, `hot_spots`, `historical_volume` — in that order within a transaction.

## Known Issues

- Frontend uses hardcoded mock data (`mockData.ts`) — not connected to backend API
- No test framework
- Twitter source requires third-party API key from twitterapi.io
- Web search scraping may break if HTML structure changes upstream
