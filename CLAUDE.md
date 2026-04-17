# PhDRadar — Project Reference

> Context file for Claude Code. Describes what the MVP is, how it's built,
> what's been done, and what's left. Read this before making changes.

## What it is
SaaS that helps prospective PhD students find and land professors. Think
"sales CRM for academia." Core loop: **sign up → discover professors →
save → AI-analyze research fit → AI-generate outreach email → send →
track application**.

## Tech stack
- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript 5**
- **Prisma 6.19** (pinned — not 7.x, client/CLI version skew breaks builds) + **Postgres**
- **NextAuth v4** — Google OAuth + credentials + password reset + email
  verification + **2FA (TOTP)** + backup codes
- **Stripe** — checkout sessions + billing portal + webhook-driven plan activation
- **Upstash Redis** — rate limiting (sliding windows)
- **Supabase Storage** — file uploads (REST, no SDK dep); local-FS fallback for dev
- **Resend** — outbound email + inbound webhook for auto-reply tracking
- **Sentry** — conditionally wired (only fires if SENTRY_DSN set)
- **OpenAI** — embeddings (text-embedding-3-small, 1536 dims)
- **Anthropic** — email gen, paper summary, research fit, funding narrative
- **Pinecone** — vector search (REST, no SDK dep); auto-creates index
- **Tailwind v4** + **shadcn/ui** + **@base-ui/react** (notably: triggers use
  `render` prop, NOT child composition — never do `<SheetTrigger><Button/></SheetTrigger>`)

## Data sources (all wired; 11 free + 2 optional paid)
**Free, no key:** OpenAlex · ArXiv · CrossRef · Semantic Scholar · CSRankings ·
DBLP · ORCID · GitHub (60/hr unauth) · Medium RSS · NSF Awards · NIH Reporter ·
Faculty page scraper (uses Anthropic for extraction if ANTHROPIC_API_KEY set,
else regex fallback).

**Paid, optional:** Google Scholar via SerpApi · LinkedIn via ProxyCurl. Both
skip silently when keys absent — OpenAlex covers 95% of Scholar for free; LinkedIn
signal is replaced by ORCID + faculty page + GitHub bio.

Per-professor enrichment (`POST /api/professors/[id]/enrich`) pulls from **all
configured sources in parallel-tolerance mode**: every source's failure is
collected into the report, never aborts siblings. Writes merged fields,
upserts up to 50 new Publications, upserts NSF/NIH grants with active/completed
classification. Auto-re-indexes in Pinecone (fire-and-forget) if semantic search
is configured. Bulk version: `enrichProfessorsByAffiliation("MIT", 10)`.

## State of the app (honest)
**Functionally complete end-to-end.** Every core user journey works against real
DB, every dashboard page is wired to real data, production build succeeds,
60 unit tests + 21 E2E tests pass, 0 type errors, 0 lint warnings.

Previously open items — all resolved:
- Vector search UI toggle on `/discover` — **done** (AI Search toggle next to
  search bar; switches between keyword and semantic endpoints)
- `EmptyState` component — **fully wired** across discover, professors, papers,
  applications, and outreach pages
- `tests/e2e/landing.spec.ts` — verified; copy matches landing page (was not
  actually stale)
- `tests/e2e/auth.spec.ts` — **done**; `globalTeardown` in Playwright config
  cleans up `@phdradar.test` users after each run
- CI E2E job — **added**; `e2e` job in `.github/workflows/ci.yml` runs
  Playwright against a Postgres service container after the main test job passes

## Key file layout
```
src/
  app/
    (public)/            # login, signup, pricing, forgot-password,
                         #   reset-password, verify-email, terms, privacy
    (dashboard)/         # dashboard, discover, professors/[id], outreach,
                         #   outreach/compose/[id], applications, papers,
                         #   profile, settings, admin, onboarding,
                         #   implement-paper/[id]
    api/
      auth/              # [...nextauth], signup, password-reset/*,
                         #   verify-email/*
      account/           # delete, password, 2fa/{setup,enable,disable}
      admin/             # stats, users, users/[id]/role, import/professors, reindex
      applications/      # CRUD
      dashboard/stats
      notifications/     # list, [id], deadline-check, follow-up-check
      outreach/          # CRUD + generate + [id]/send
      papers/            # list + [id]/summarize
      professors/[id]/   # detail + analyze + enrich + funding-forecast
      saved-professors/  # list + [professorId] CRUD
      search/            # professors (GET/POST with all filters), semantic
      scraping/          # trigger, status
      stripe/            # checkout, portal
      upload              # Supabase REST or local FS fallback
      webhooks/          # stripe, resend (inbound reply tracking)
      export, health, profile
    global-error.tsx     # styled error boundary (Tailwind)
    layout.tsx, providers.tsx

  components/
    dashboard/           # Sidebar, MobileNav, TopBar, NotificationsBell,
                         #   VerifyEmailBanner, OnboardingGate, TwoFactorCard
    ui/                  # shadcn components (Base UI under the hood)
    EmptyState.tsx, CookieConsent.tsx, PWARegister.tsx

  lib/
    auth.ts              # NextAuth config with 2FA check in authorize()
    prisma.ts, redis.ts, rate-limit.ts
    errors.ts            # AppError hierarchy + apiResponse/apiError/paginatedResponse
    api-auth.ts          # requireAuth, requireAdmin, auditLog, verifyCsrf
    storage.ts           # uploadFile (Supabase REST + local FS fallback)
    email.ts             # Resend wrappers (welcome, verify, reset, digest, reminders)
    stripe.ts, anthropic.ts
    embeddings.ts        # OpenAI text-embedding-3-small wrapper
    pinecone.ts          # REST client (no SDK dep); auto-creates index
    totp.ts              # RFC 6238 from scratch; backup codes; otpauth URI
    csv.ts               # zero-dep CSV parser with quoted fields
    logger.ts            # JSON structured logger with redaction
    retry.ts, utils.ts

  services/
    ai/                  # emailGenerator, researchAnalyzer, paperSummarizer,
                         #   fundingPredictor (rule-based + Claude narrative)
    scraper/             # openAlex, arxiv, crossref, semanticScholar,
                         #   csRankings, dblp, orcid, github, medium,
                         #   linkedin, googleScholar, facultyPage,
                         #   nsfAwards, nihReporter,
                         #   enrichProfessor.ts  ← orchestrator
                         #   runner.ts           ← bulk keyword source runner
    search/
      semantic.ts        # indexProfessor, semanticSearchProfessors, reindexAll
    notifications/       # deadlineAlert, followUpReminder

  proxy.ts               # Next.js 16 renamed middleware → proxy. Handles CSRF
                         # + auth redirects for /(dashboard) routes.
  instrumentation.ts     # Sentry register hook

prisma/
  schema.prisma
  migrations/
    migration_lock.toml
    0_init/              # baseline — represents all schema up to 2FA
    20260416000001_add_2fa/

tests/
  unit/                  # errors, scoring, validation, storage,
                         #   webhook-helpers, totp (with RFC 6238 vector)
  integration/           # stripe-checkout (Zod schema test)
  e2e/                   # landing, auth, protected-routes, api-health,
                         #   global-teardown (cleans @phdradar.test users)

.github/workflows/ci.yml # lint+typecheck + test + build + e2e (separate jobs)
Dockerfile + .dockerignore  # multi-stage; standalone output; non-root runner
vercel.json              # crons for deadline + follow-up checks
sentry.{client,server,edge}.config.ts
```

## Environment variables

Everything below is **optional** except `DATABASE_URL` and `NEXTAUTH_SECRET`.
All optional integrations skip gracefully.

```bash
# --- Required ---
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="<openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"   # or your prod URL

# --- Core integrations (strongly recommended) ---
ANTHROPIC_API_KEY="sk-ant-..."         # email gen, paper summary, etc.
RESEND_API_KEY="re_..."                # outbound email
EMAIL_FROM="PhDRadar <notifications@yourdomain.com>"
GOOGLE_CLIENT_ID=""                    # if blank, Google sign-in hidden
GOOGLE_CLIENT_SECRET=""

# --- Upstash Redis (rate limits degrade gracefully without) ---
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# --- Stripe (checkout + webhooks) ---
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PRO="price_..."
STRIPE_PRICE_PREMIUM="price_..."

# --- Supabase Storage (uploads fall back to ./public/uploads locally) ---
SUPABASE_URL=""
SUPABASE_SERVICE_KEY=""
SUPABASE_STORAGE_BUCKET="user-uploads"

# --- Semantic search (both needed; otherwise feature dark) ---
OPENAI_API_KEY="sk-..."                # embeddings
PINECONE_API_KEY=""
PINECONE_INDEX="phdradar"              # auto-created on first use

# --- Data scrapers — all optional ---
GITHUB_TOKEN=""                        # 60/hr → 5k/hr
SEMANTIC_SCHOLAR_API_KEY=""
OPENALEX_MAILTO=""                     # polite pool
CROSSREF_MAILTO=""                     # polite pool
SERPAPI_KEY=""                         # paid; Google Scholar
PROXYCURL_API_KEY=""                   # paid; LinkedIn

# --- Sentry (build/runtime skip if not set) ---
SENTRY_DSN=""
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_ORG=""                          # for build-time source map upload
SENTRY_PROJECT=""
SENTRY_AUTH_TOKEN=""

# --- Cron + misc ---
CRON_SECRET="<random>"                 # gates /api/notifications/* cron
RESEND_WEBHOOK_SECRET=""               # Svix format: whsec_...
LOG_LEVEL="info"                       # debug|info|warn|error
```

## Commands cheatsheet
```bash
npm run dev                            # Next.js 16 dev server on :3000
npm run build                          # production build
npm test                               # Jest unit + integration
npx playwright test                    # E2E (needs dev server running)
npm run type-check                     # tsc --noEmit
npm run lint                           # eslint
npm run seed                           # seeds 25 unis + 5 profs + grants + pubs

# Prisma
npx prisma migrate deploy              # PROD — apply committed migrations
npx prisma migrate dev --name foo      # DEV — create + apply
npx prisma db push                     # DEV ONLY — skips migrations
npx prisma generate                    # regen client (run after schema changes)
npx prisma studio                      # DB GUI
```

## Deployment recommendation
**Vercel + Neon + Upstash + Supabase Storage + Resend + Stripe + Sentry.**
All have free tiers covering MVP scale. Expected cost at 0–2k users: **$0–20/mo.**

- `vercel.json` already has: build command with `prisma generate`, cron
  schedules for deadline/follow-up checks, `X-Robots-Tag: noindex` on API routes
- Docker deploy alternative: `docker build -t phdradar . && docker run -p 3000:3000 --env-file .env phdradar`

## Quirks & gotchas
- **Prisma 7.x breaks everything.** Pin `@prisma/client` and `prisma` to the
  same 6.19.x. Different majors = "Cannot find module '@prisma/client/runtime/library.js'".
- **Base UI triggers use `render` prop**, not children-as-button. Wrapping
  `<Button>` inside `<SheetTrigger>` / `<DialogTrigger>` / `<DropdownMenuTrigger>`
  makes nested `<button>` → hydration error. Use
  `<SheetTrigger render={<Button />}>…</SheetTrigger>`.
- **Next.js 16 renamed `middleware.ts` → `proxy.ts`.** Don't create both.
  Existing `src/proxy.ts` already handles CSRF + dashboard auth redirects.
- **CSP allows `'unsafe-eval'` in dev only.** Handled in `next.config.ts`.
- **Cron endpoints (`/api/notifications/*-check`)** auth via
  `Authorization: Bearer <CRON_SECRET>`. Vercel Cron sends this automatically
  if `CRON_SECRET` env is set.
- **Onboarding redirect** is done client-side via `OnboardingGate` in the
  dashboard layout, NOT in `proxy.ts` — keeps edge middleware lean.
- **Auth rate limiter** uses Upstash; when Redis is unconfigured it fails
  open (logs pass through). That's intentional for dev; prod must have Upstash set.
- **ArXiv MUST be HTTPS.** `http://export.arxiv.org` drops connections silently.
- **Medium RSS** requires a browser-style `User-Agent`; bot UAs get empty feeds.

## Local quick start
```bash
# 1. Clone, install, env
cp .env.example .env
# Fill in at least DATABASE_URL and NEXTAUTH_SECRET
npm install

# 2. DB
npx prisma migrate deploy          # or: prisma db push for a fresh DB
npm run seed                       # populate demo data

# 3. Run
npm run dev                        # http://localhost:3000

# 4. To test as admin, promote a user in DB:
#    UPDATE "User" SET role='ADMIN' WHERE email='you@example.com';
```

## Testing conventions
- Unit tests: `tests/unit/*.test.ts` — pure functions, no network, no DB
- Integration: `tests/integration/*.test.ts` — schema parsing, etc.
- E2E: `tests/e2e/*.spec.ts` — requires dev server; Playwright auto-starts it
  via `webServer` config

If you touch auth, run `tests/unit/totp.test.ts` — it has the RFC 6238 vector
that guarantees TOTP correctness.

## How Claude Code should work in this repo
- **Never run `prisma db push` in production.** Use `prisma migrate deploy`.
- **Never add deps unless genuinely needed.** We've deliberately avoided
  `svix`, `qrcode`, `@pinecone-database/pinecone`, `@supabase/supabase-js`,
  etc. by using REST directly.
- **Keep `base-ui` triggers as `render={…}` prop.** If you write
  `<XTrigger><Button/></XTrigger>` you'll break hydration.
- **Every `"use client"` file that uses `useSession` must be inside
  `<SessionProvider>`** — that's set up in `src/app/providers.tsx`, already
  wrapped in the root layout. Don't double-wrap.
- **Prefer editing over creating.** No new README.md, no docs/*.md unless
  explicitly asked.
- **Run `npx tsc --noEmit` and `npx eslint .` before ending any change** —
  the codebase is clean and should stay that way.
