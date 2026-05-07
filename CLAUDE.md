# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal clipboard app with topic-based organization, password authentication, and Cloudflare D1 storage. Built with Next.js 16, React 19, and Tailwind CSS 4. Deploys to Cloudflare Pages.

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev             # Local development server
pnpm build           # Production build (Next.js)
pnpm lint            # Run ESLint
pnpm pages:build     # Build for Cloudflare Pages (@cloudflare/next-on-pages)
pnpm pages:deploy    # Deploy to Cloudflare Pages production
pnpm pages:deploy:preview  # Deploy to Cloudflare Pages preview branch
pnpm pages:dev       # Local Cloudflare Pages dev server
```

## Architecture

**Framework**: Next.js 16 App Router with Edge runtime for API routes.

**Data Layer**:
- Cloudflare D1 for persistence via `wrangler.toml` binding `DB`
- [lib/d1.ts](lib/d1.ts) wraps D1 access with a mock fallback for local development without D1
- `getD1()` returns `env.DB` from Cloudflare context; falls back to `mockDB` when D1 unavailable

**Authentication**:
- Client-side auth state via [lib/auth-context.tsx](lib/auth-context.tsx) using sessionStorage
- Server validation at `POST /api/auth` checks password against D1 `settings` table or mock
- Default password: `clipboard123`

**API Routes** (in `app/api/`):
- `GET/POST /api/topics` - List all topics, create new topic
- `GET/PUT/PATCH/DELETE /api/topics/[id]` - CRUD for specific topic
- `GET/POST /api/auth` - Health check and password validation

**Database Schema** (see [scripts/d1-init.sql](scripts/d1-init.sql)):
- `settings` table: key-value store for password
- `topics` table: id, name, content, created_at, updated_at

**UI Components**:
- [components/ui/](components/ui/) - Shadcn/ui-style components built on Radix UI primitives
- [components/dashboard.tsx](components/dashboard.tsx) - Main app shell
- [components/clipboard-editor.tsx](components/clipboard-editor.tsx) - Content editing area
- [components/topic-sidebar.tsx](components/topic-sidebar.tsx) - Topic list management

**Styling**: Tailwind CSS 4 with CSS variables in `app/globals.css`, dark/light mode via `next-themes`.

## Cloudflare Deployment

See [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md) for full deployment guide. Key points:

1. D1 database `clipboard-db` must be created and bound in `wrangler.toml`
2. Run `pnpm pages:build` then `pnpm pages:deploy` to deploy
3. Windows may fail on `next-on-pages`; use Ubuntu or Git-triggered Cloudflare builds
4. Tail logs with: `pnpm exec wrangler pages deployment tail --project-name=clipboard --format pretty`

## Important Notes

- API routes use `export const runtime = "edge"` - no Node.js APIs in route handlers
- Mock DB in `lib/d1.ts` provides development fallback but is read-only for passwords (hardcoded `clipboard123`)
- `ignoreBuildErrors: true` in next.config.mjs - build succeeds even with type errors