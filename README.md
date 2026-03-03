# Identity Reconciliation Service

Backend service for identity reconciliation using JavaScript, Express, Prisma, and PostgreSQL (Neon-ready).

Note: this repository currently uses `dist/` JavaScript files as the active runtime/source code.

## Problem understanding

Given `email` and/or `phoneNumber`, the service resolves one identity cluster:

- Contacts are related if they share `email` or `phoneNumber`.
- Each cluster has exactly one `PRIMARY` contact.
- All others are `SECONDARY` with `linkedId = primary.id`.
- If input connects separate clusters, they are merged atomically.

This problem models identity reconciliation as dynamic connected component resolution where each contact represents a node and shared attributes represent edges.

## Project structure

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
```

## Prisma and Neon setup

Use both URLs:

- `DATABASE_URL`: Neon pooled connection (pooler host)
- `DIRECT_URL`: Neon direct connection (non-pooler host, used by migrations)

Example is already in `.env.example`.

Set your local `.env`:

```env
PORT="3000"
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-xxxx-pooler.region.aws.neon.tech/DB_NAME?sslmode=require&pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxxx-xxxx.region.aws.neon.tech/DB_NAME?sslmode=require&connect_timeout=15"
```

## Run with npm (local)

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npm run prisma:generate
```

3. Create/update schema:

```bash
npm run prisma:db:push
```

4. Start API:

```bash
npm run start
```

## Run with Docker

1. Build and start services:

```bash
docker compose up --build
```

2. Access service:

- Home: `http://localhost:3000/`
- Health: `http://localhost:3000/health`
- API docs: `http://localhost:3000/docs`

3. Stop services:

```bash
docker compose down
```

## Is Docker mandatory?

No. Docker is optional for this project.

- Use Docker when you want consistent local setup (`app + postgres`) in one command.
- For Neon + Render deployment, Docker is not required.

## Deployment checklist (Neon + JavaScript)

1. Set production env vars on your platform:

```env
PORT=3000
DATABASE_URL=<neon pooled url>
DIRECT_URL=<neon direct url>
NODE_ENV=production
```

2. Run Prisma schema sync during deploy/start:

```bash
npm run prisma:generate
npm run prisma:db:push
```

3. Start server:

```bash
npm run start
```

4. Verify:

- `GET /health` returns `200`
- `POST /identify` returns the expected contact payload

## Deploy on Render (recommended for this task)

`/identify` can be hosted on Render without Docker.

1. Push this repo to GitHub.
2. In Render, create a `Web Service` from your GitHub repo.
3. Use:
   - Build Command: `npm ci && npm run prisma:generate`
   - Start Command: `npm run prisma:db:push && npm run start`
4. Add environment variables in Render:
   - `DATABASE_URL` = Neon pooled URL
   - `DIRECT_URL` = Neon direct URL
   - `NODE_ENV` = `production`
5. Deploy and verify:
   - `GET /health`
   - `POST /identify`

### Render port note

On Render, do not force a fixed port. Render injects `PORT` automatically.

This app already supports that:

- it reads `process.env.PORT`
- falls back to `3000` only for local runs

## Submission checklist

1. Publish repository on GitHub.
2. Keep small commits with meaningful messages.
3. Share live `/identify` endpoint URL in README.
4. Ensure request body uses JSON (not form-data).

## Migrations (recommended for production)

Local/dev migration creation:

```bash
npm run prisma:migrate
```

Production migration apply:

```bash
npm run prisma:migrate:deploy
```

## API

### POST /identify

Request:

```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

Response:

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["alice@example.com"],
    "phoneNumbers": ["12345"],
    "secondaryContactIds": []
  }
}
```

Extra endpoints:

- `GET /` (homepage guide with quick usage instructions)
- `GET /health`
- `GET /docs`

## Notes

- Prisma logic is inside your Node app process; Neon is just the Postgres host.
- No Prisma API key is required. Only DB credentials in connection URLs are required.
- Docker now includes `dist/` because this repo uses `dist/` as active runtime source.
