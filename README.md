# Bitespeed Identity Reconciliation Service

Identity reconciliation backend built with Node.js, Express, Prisma, and PostgreSQL.

## Live Endpoint

- Base URL: `http://bitespeed-identity-service-ws9x.onrender.com`
- Identify URL: `http://bitespeed-identity-service-ws9x.onrender.com/identify`

## Problem Statement

Given an incoming `email` and/or `phoneNumber`, the service must return a single consolidated identity view.

Rules implemented:

1. Two contacts are related if either `email` or `phoneNumber` matches.
2. Each connected identity group has exactly one `primary` contact.
3. Remaining contacts are `secondary` with `linkedId = primary.id`.
4. If a request bridges two existing groups, groups are merged in one transaction.

This problem models identity reconciliation as dynamic connected component resolution where each contact represents a node and shared attributes represent edges.

## How Reconciliation Works

At `POST /identify`, the service:

1. Normalizes input (`trim`, empty string -> `null`, requires at least one field).
2. Finds direct matches by email/phone.
3. Expands to full connected cluster.
4. Chooses canonical primary by oldest `createdAt` (tie-breaker: lowest `id`).
5. Converts non-primary records to `secondary`.
6. Creates a new secondary only when request adds new information.
7. Returns deduplicated emails/phone numbers and secondary IDs.

To reduce race conditions:

- `SERIALIZABLE` transaction isolation is used.
- advisory locks are acquired per identifier.
- retry/backoff is applied for transient transaction conflicts.

## Stack

- Node.js + Express
- Prisma ORM
- PostgreSQL (Neon supported)
- Docker / Docker Compose (optional)
- Render deployment config (`render.yaml`)

## Project Layout

```text
dist/
  controllers/
  services/
  repositories/
  routes/
  types/
  utils/
  lib/
  app.js
  server.js
prisma/
  schema.prisma
Dockerfile
docker-compose.yml
render.yaml
```

## API Contract

### `POST /identify`

Request body (`application/json`):

```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

Successful response:

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

Important:

- Use JSON body, not form-data.
- At least one of `email` or `phoneNumber` is required.

### Utility Endpoints

- `GET /` -> human-friendly homepage with usage guide
- `GET /health` -> health status
- `GET /docs` -> Swagger UI

## Run Locally (npm)

1. Install dependencies:

```bash
npm install
```

2. Configure env (`.env`), example:

```env
PORT="3000"
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-xxxx-pooler.region.aws.neon.tech/DB_NAME?sslmode=require&pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxxx-xxxx.region.aws.neon.tech/DB_NAME?sslmode=require&connect_timeout=15"
```

3. Sync schema:

```bash
npm run prisma:generate
npm run prisma:db:push
```

4. Start service:

```bash
npm run start
```

5. Verify quickly:

```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"lorraine@hillvalley.edu","phoneNumber":"123456"}'
```

## Run with Docker (Optional)

```bash
docker compose up --build
```

Local URLs:

- `http://localhost:3000/`
- `http://localhost:3000/health`
- `http://localhost:3000/docs`

Stop:

```bash
docker compose down
```

## Deploy on Render (Neon + Node)

1. Push repo to GitHub.
2. Create a Render Web Service.
3. Use:
   - Build command: `npm ci && npm run prisma:generate`
   - Start command: `npm run prisma:db:push && npm run start`
4. Set env vars in Render:
   - `DATABASE_URL` (Neon pooled URL)
   - `DIRECT_URL` (Neon direct URL)
   - `NODE_ENV=production`

Port note:

- Render injects `PORT` automatically.
- App already reads `process.env.PORT`.

## Design Notes / Tradeoffs

- `db push` is used for quick iteration and deployment simplicity.
- For stricter production change control, prefer `prisma migrate deploy`.
- Runtime source is intentionally kept in `dist/` to keep project JS-only.

## Submission Checklist

1. Keep small, meaningful commits.
2. Add deployed endpoint URLs in this README.
3. Ensure `/identify` works with JSON payloads.
