# PhD Radar

A full-stack web app that helps researchers discover and track PhD opportunities — programs, positions, funding, and deadlines. Production stack: Next.js 16 + Prisma + NextAuth + Upstash Redis + Sentry + Playwright tests.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)

## What it does

- **Search** PhD programs and positions across institutions
- **Track** saved opportunities with deadlines and status
- **Intelligent matching** — LLM-assisted parsing of position descriptions to surface relevant roles
- **Auth** via NextAuth with Prisma adapter
- **Rate limiting** on public endpoints via Upstash
- **Observability** via Sentry (errors + performance)

## Tech stack — built like a real app

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Prisma ORM (Postgres-compatible) |
| Auth | NextAuth + Prisma adapter + bcryptjs |
| Caching / rate limit | Upstash Redis + `@upstash/ratelimit` |
| LLM layer | OpenAI SDK |
| Analytics | PostHog |
| Observability | Sentry (Next.js SDK) |
| Forms | react-hook-form + Zod resolvers |
| UI | `@base-ui/react`, lucide-react, date-fns, class-variance-authority |
| Tests | Jest (unit + integration) + Playwright (e2e) |

## Quick start

```bash
git clone https://github.com/Hassan-Naeem-code/PHD-Radar.git
cd PHD-Radar

npm install
cp .env.example .env         # fill in DB, auth, Upstash, OpenAI keys

# Set up the database
npx prisma generate
npx prisma db push
npm run seed

npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm run seed` | Seed the DB |
| `npm run db:push` | Push schema changes |
| `npm run db:migrate` | Deploy migrations |
| `npm run db:studio` | Prisma Studio (data browser) |
| `npm run type-check` | TypeScript check, no emit |
| `npm run test` | Jest (all) |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests only |
| `npm run test:e2e` | Playwright end-to-end |
| `npm run test:coverage` | Jest with coverage |

## Project layout

```
.
├── src/
│   ├── app/                  # App Router pages + API routes
│   ├── components/           # UI
│   ├── hooks/                # React hooks
│   ├── lib/                  # clients, config
│   ├── services/             # business logic / data layer
│   ├── utils/
│   ├── types/
│   ├── instrumentation.ts    # Sentry instrumentation entry
│   └── proxy.ts
├── prisma/                   # schema + seed + migrations
├── tests/                    # unit + integration + e2e
├── next.config.ts
├── Dockerfile
└── package.json
```

## Operations

- **Docker** image provided — production deploy target is any container platform
- **CI-ready** — lint, type-check, unit, integration, e2e all scriptable
- **Error budgets** via Sentry + PostHog funnels

## License

MIT
