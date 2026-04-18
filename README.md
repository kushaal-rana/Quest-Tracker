# Quest Tracker

Personal quarterly quest dashboard. Built for daily logging with ⌘K, weekly focus, streaks, and confetti.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind v4
- Supabase (Postgres + Auth)
- Drizzle ORM
- shadcn/ui + cmdk + sonner + canvas-confetti
- Deployed on Vercel

## First-time setup

You'll need to do four things outside this repo before `npm run dev` works.

### 1. Create a Supabase project

1. Go to https://supabase.com/dashboard and create a new project (free tier).
2. Pick region: **West US (North California)** — closest to San Jose.
3. Save the database password somewhere safe.
4. Once provisioned (~2 min), open **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Open **Settings → Database → Connection string → URI**. Copy the string with port `5432` (direct, not pooler) → `DATABASE_URL`. Replace `[YOUR-PASSWORD]` with the password from step 3.

### 2. Set up Google OAuth in Supabase

1. Go to https://console.cloud.google.com → create a new project (or pick existing).
2. **APIs & Services → OAuth consent screen** → External → fill in app name, your email.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Type: **Web application**
   - Authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback` (find the exact URL in Supabase under **Authentication → Providers → Google**)
4. Copy the Client ID and Client Secret.
5. In Supabase: **Authentication → Providers → Google** → enable, paste Client ID + Secret, save.

### 3. Configure local env

```bash
cp .env.local.example .env.local
# Fill in the three values from step 1
```

### 4. Push the schema

```bash
npm run db:push
```

This applies `src/lib/db/schema.ts` to your Supabase database. Re-run any time you change the schema.

After that:

```bash
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run db:push` — push schema to Supabase
- `npm run db:studio` — open Drizzle Studio (DB GUI)

## Security posture

- All tables enforce Postgres Row-Level Security (RLS): `user_id = auth.uid()`. The database itself rejects cross-user reads/writes — even if app code is buggy.
- Auth handled by Supabase (Google OAuth). No passwords stored locally.
- `.env.local` is gitignored. Never commit secrets.

### Known accepted vulnerabilities

- **GHSA-67mh-4wv8-2f99 (esbuild dev server CSRF, moderate × 4)**: transitive via `drizzle-kit → @esbuild-kit/esm-loader → esbuild`. **Not exploitable in our usage** — drizzle-kit is a CLI for migrations and never starts esbuild's dev server. Re-evaluate when drizzle-kit upgrades its esbuild dependency.

## Deployment

Vercel project linked to this repo. `main` → production, every PR → preview URL. Same env vars set in Vercel dashboard.
