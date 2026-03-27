# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

テラコード (TeraCode) は仏教寺院の檀家・法要・過去帳を管理するWebアプリケーション。

**Tech Stack:** Next.js 16 (App Router) + TypeScript + PostgreSQL + Prisma ORM + NextAuth.js + Tailwind CSS 4

## Common Commands

```bash
# Development
npm run dev          # Dev server at localhost:3000 (uses webpack, not Turbopack)

# Build & Production
npm run build        # Build standalone Next.js app
npm start            # Start production server

# Linting
npm run lint         # ESLint

# Database
npx prisma migrate dev --name <name>   # Create and run a migration
npx prisma generate                    # Regenerate Prisma client (also runs via postinstall)
npx prisma db execute --file scripts/update-uuid.sql

# Admin Scripts
npx tsx scripts/create-admin.ts        # Create admin user
npx tsx scripts/promote-admin.ts       # Promote existing user to admin
```

## Architecture

### Request Flow

```
Browser → Nginx (HTTPS) → Next.js (port 3000) ↔ PostgreSQL
                              ↓
                    middleware.ts (auth guard)
                              ↓
                    /api/** routes or page routes
                              ↓
                    Prisma ORM ↔ Database
```

### Key Directories

- `src/app/api/` — RESTful API routes (Next.js App Router)
- `src/app/(pages)/` — UI pages
- `src/lib/` — Shared utilities (Prisma singleton, auth helpers, document templating)
- `src/components/` — Shared components (NavMenu)
- `src/types/` — TypeScript types
- `prisma/` — Schema + migrations
- `scripts/` — One-off admin/setup scripts (run with `npx tsx`)
- `nginx/` — Reverse proxy config + SSL certs

### Authentication

- NextAuth.js with Credentials provider (email/password), JWT strategy
- `src/auth.ts` — Main NextAuth config and handlers
- `src/auth.config.ts` — Edge-compatible config (used by middleware)
- `middleware.ts` — Protects all routes; redirects unauthenticated users to `/login`
- `isAdmin` flag on `User` model gates admin-only routes/APIs

### Database Models

| Model | Purpose |
|---|---|
| `FamilyRegister` | Family/kinship group ledger |
| `Householder` | Parishioner (head of household) |
| `HouseholderMember` | Individual members within a household |
| `Ceremony` | Rituals/ceremonies (MEMORIAL, REGULAR, FUNERAL, SPECIAL, OTHER) |
| `CeremonyParticipant` | Links householders to ceremonies with offering amounts |
| `User` | Login accounts |

### Key Features

- **Householder management** — `/householder/` pages + `/api/householder/`
- **Family register** — `/family-register/` (current 現在帳 and posthumous 過去帳 ledgers)
- **Ceremonies** — `/ceremonies/` for scheduling rituals and tracking offerings (御布施)
- **Document export** — Word (.docx) generation via `src/lib/docx-template.ts` (docxtemplater + nunjucks)
- **Data import** — YAML and Microsoft Access (.mdb) file import via `/api/import/`

### Deployment

Production runs as a **standalone Next.js build** managed by PM2, behind Nginx with Let's Encrypt SSL.

- `deploy.sh` — Full deploy pipeline: git pull → npm ci (if needed) → prisma generate → build → sync assets → PM2 restart → nginx reload
- `ecosystem.config.cjs` — PM2 process config
- `nginx/conf.d/default.conf` — Reverse proxy; 50MB upload limit; long-term cache for `/_next/static/`; no-cache for HTML/API
- `docker-compose.yml` — PostgreSQL + Nginx + Certbot containers

### Important Configuration Notes

- **Prisma is an external package** in the standalone build (`serverExternalPackages` in `next.config.ts`). Generated client lives in `src/generated/prisma/`.
- **Webpack is forced** in dev (`next dev --turbopack` is explicitly avoided) due to compatibility issues.
- **Static asset sync** during deploy is critical — the `deploy.sh` script copies `public/` and `.next/static/` into the standalone output directory to avoid stale chunk errors.
- Chunk recovery logic in `src/app/layout.tsx` auto-reloads the page if old chunk references fail to load after a deploy.

### Environment Variables

Required in `.env`:
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — NextAuth secret
- `AUTH_URL` — Public-facing base URL (used for OAuth redirects)
