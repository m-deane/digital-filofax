# Digital Filofax - Hosting & Deployment Guide

## Overview

Digital Filofax is a full-stack personal organization app built with:

- **Next.js 15** (App Router, React 19, Turbopack)
- **TypeScript 5.7**
- **tRPC v11 RC** (API layer)
- **Prisma 6** (ORM)
- **PostgreSQL** (database, via Supabase)
- **NextAuth v5 beta** (authentication)
- **Tailwind CSS 3 + shadcn/ui** (styling)

**Runtime requirements:**
- Node.js 18+ (20 LTS recommended)
- PostgreSQL 15+ database
- GitHub OAuth app (for login + repo integration)
- Google OAuth app (for login + Google Calendar integration)

---

## Option A: Vercel + Supabase (Recommended)

This is the simplest path. Vercel has first-class Next.js support, and the project already uses Supabase for PostgreSQL.

### Prerequisites

- A [Vercel](https://vercel.com) account (free tier works)
- A [Supabase](https://supabase.com) project already created with a PostgreSQL database
- A [GitHub OAuth App](https://github.com/settings/developers) configured
- A [Google OAuth App](https://console.cloud.google.com/apis/credentials) configured
- Git repository (GitHub, GitLab, or Bitbucket) with the project code

### Step 1: Push Code to a Git Repository

```bash
git remote add origin https://github.com/YOUR_USERNAME/digital-filofax.git
git push -u origin main
```

### Step 2: Import Project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** and select your repository
3. Vercel auto-detects it as a Next.js project -- accept defaults
4. **Do not deploy yet** -- configure environment variables first

### Step 3: Configure Environment Variables

In the Vercel dashboard, go to **Settings > Environment Variables** and add each of the following:

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true` | Supabase connection pooler URL (port 6543). Find in Supabase > Settings > Database > Connection string > URI (Pooler mode) |
| `DIRECT_URL` | `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres` | Direct connection (port 5432). Used by Prisma migrations. Find in Supabase > Settings > Database > Connection string > URI (Direct) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[REF].supabase.co` | Supabase project URL. Find in Supabase > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase anon/public key. Find in Supabase > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase service role key. Find in Supabase > Settings > API |
| `AUTH_SECRET` | (random string) | Generate with: `openssl rand -base64 32` |
| `AUTH_URL` | `https://your-app.vercel.app` | Your Vercel deployment URL (update after first deploy if using auto-generated URL) |
| `AUTH_GITHUB_ID` | (from GitHub) | GitHub OAuth App > Client ID |
| `AUTH_GITHUB_SECRET` | (from GitHub) | GitHub OAuth App > Client Secret |
| `AUTH_GOOGLE_ID` | (from Google) | Google Cloud Console > Credentials > OAuth 2.0 Client ID |
| `AUTH_GOOGLE_SECRET` | (from Google) | Google Cloud Console > Credentials > OAuth 2.0 Client Secret |

> **Important:** Do NOT set `DEV_AUTH_BYPASS` in production. That is for local development only.

### Step 4: Update OAuth Callback URLs

After your first deploy, you will have a Vercel URL (e.g. `https://digital-filofax.vercel.app`). Update your OAuth apps to use it:

**GitHub OAuth App** ([github.com/settings/developers](https://github.com/settings/developers)):
- Homepage URL: `https://your-app.vercel.app`
- Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`

**Google OAuth App** ([console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)):
- Authorized JavaScript origins: `https://your-app.vercel.app`
- Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`

Google scopes required (already configured in code):
- `openid`, `email`, `profile`
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`

GitHub scopes required (already configured in code):
- `read:user`, `user:email`, `repo`

### Step 5: Deploy

```bash
# Option 1: Deploy from Vercel dashboard
# Just click "Deploy" after setting environment variables

# Option 2: Deploy from CLI
npm i -g vercel
vercel link        # Link to your Vercel project
vercel --prod      # Deploy to production
```

### Step 6: Push Database Schema (One-Time)

After the first deploy, push the Prisma schema to your production Supabase database:

```bash
# Set the production DATABASE_URL temporarily
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# Push schema to production database
npx prisma db push

# Optionally seed the database
npx tsx prisma/seed.ts
```

Alternatively, you can run this via Vercel's build command by temporarily adding to `package.json`:
```json
"vercel-build": "prisma generate && prisma db push && next build"
```
Then revert to the standard build after the first deploy.

### Step 7: Custom Domain (Optional)

1. In Vercel dashboard: **Settings > Domains > Add Domain**
2. Enter your domain (e.g. `filofax.yourdomain.com`)
3. Add the DNS records Vercel provides (CNAME or A record)
4. Update `AUTH_URL` environment variable to `https://filofax.yourdomain.com`
5. Update GitHub and Google OAuth callback URLs to use the custom domain
6. Redeploy: `vercel --prod`

---

## Option B: Railway

[Railway](https://railway.app) provides an all-in-one platform with built-in PostgreSQL.

### Steps

1. Create a Railway account at [railway.app](https://railway.app)
2. Click **New Project > Deploy from GitHub repo** and select your repo
3. Add a **PostgreSQL** service in the same project
4. Railway auto-provides `DATABASE_URL` -- copy it and also set `DIRECT_URL` to the same value
5. Add all other environment variables (same as the Vercel table above, minus the Supabase-specific ones):
   - `AUTH_SECRET`, `AUTH_URL`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
6. Set the build command: `npx prisma generate && npm run build`
7. Set the start command: `npm run start`
8. Deploy. Railway assigns a URL like `https://your-app.up.railway.app`
9. Push schema: Connect to the Railway Postgres and run `npx prisma db push`
10. Update OAuth callback URLs to point to the Railway URL

> **Note:** Railway's free tier has usage limits. The Hobby plan ($5/month) is recommended for persistent deployments.

---

## Option C: Self-Hosted (VPS / Docker)

For full control, deploy on any VPS (DigitalOcean, Hetzner, AWS EC2, etc.).

### Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

> **Note:** For standalone output, add `output: "standalone"` to `next.config.ts`.

### Docker Compose (with PostgreSQL)

```yaml
version: "3.8"
services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: filofax
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: changeme
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    restart: always
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:changeme@db:5432/filofax
      DIRECT_URL: postgresql://postgres:changeme@db:5432/filofax
      AUTH_SECRET: ${AUTH_SECRET}
      AUTH_URL: https://your-domain.com
      AUTH_GITHUB_ID: ${AUTH_GITHUB_ID}
      AUTH_GITHUB_SECRET: ${AUTH_GITHUB_SECRET}
      AUTH_GOOGLE_ID: ${AUTH_GOOGLE_ID}
      AUTH_GOOGLE_SECRET: ${AUTH_GOOGLE_SECRET}
    depends_on:
      - db

volumes:
  pgdata:
```

### Deploy Commands

```bash
# Build and run
docker compose up -d

# Push schema (first time)
docker compose exec app npx prisma db push

# View logs
docker compose logs -f app
```

Use a reverse proxy (nginx, Caddy, Traefik) for HTTPS and custom domain routing.

---

## Environment Variables Reference

| Variable | Required | Description | Where to Get It |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (pooled) | Supabase Dashboard > Settings > Database, or your own PostgreSQL |
| `DIRECT_URL` | Yes | PostgreSQL direct connection (for migrations) | Same as above, direct (non-pooled) connection |
| `NEXT_PUBLIC_SUPABASE_URL` | If using Supabase | Supabase project URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | If using Supabase | Supabase anonymous public key | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | If using Supabase | Supabase service role key (server-side only) | Supabase Dashboard > Settings > API |
| `AUTH_SECRET` | Yes | NextAuth session encryption secret | Generate: `openssl rand -base64 32` |
| `AUTH_URL` | Yes | Canonical URL of the deployed app | Your deployment URL (e.g. `https://your-app.vercel.app`) |
| `AUTH_GITHUB_ID` | Yes | GitHub OAuth App Client ID | [github.com/settings/developers](https://github.com/settings/developers) > OAuth Apps |
| `AUTH_GITHUB_SECRET` | Yes | GitHub OAuth App Client Secret | Same as above |
| `AUTH_GOOGLE_ID` | Yes | Google OAuth Client ID | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) > Credentials |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth Client Secret | Same as above |
| `DEV_AUTH_BYPASS` | No | Set to `true` to bypass OAuth in development | Only for local dev. **Never set in production.** |

---

## Post-Deployment Checklist

- [ ] **Database schema pushed** -- Run `npx prisma db push` against production database
- [ ] **OAuth callback URLs updated** -- Both GitHub and Google OAuth apps point to your production URL
  - GitHub: `https://YOUR_DOMAIN/api/auth/callback/github`
  - Google: `https://YOUR_DOMAIN/api/auth/callback/google`
- [ ] **AUTH_URL matches deployment URL** -- Must match exactly (including `https://`)
- [ ] **AUTH_SECRET is set** -- A unique random string, not the example value
- [ ] **First login works** -- Sign in with GitHub or Google, verify session is created
- [ ] **DEV_AUTH_BYPASS is NOT set** -- This must never be enabled in production
- [ ] **Database seed (optional)** -- Run `npx tsx prisma/seed.ts` if you want sample data
- [ ] **Dev user cleanup** -- If you seeded with dev data, remove the `dev-user-123` account from production
- [ ] **HTTPS is active** -- Vercel handles this automatically; for self-hosted, configure TLS certificates
- [ ] **Custom domain configured** -- If using a custom domain, DNS records are propagated and OAuth URLs are updated

---

## iOS / PWA Support (Preview)

Once deployed to a public URL, you can enable Progressive Web App support so the app can be added to an iOS or Android home screen.

### Step 1: Install PWA Package

```bash
npm install @ducanh2912/next-pwa
```

### Step 2: Configure next.config.ts

```typescript
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default withPWA(nextConfig);
```

### Step 3: Create public/manifest.json

```json
{
  "name": "Digital Filofax",
  "short_name": "Filofax",
  "description": "Your personal digital organizer",
  "start_url": "/dashboard/daily",
  "display": "standalone",
  "background_color": "#faf9f6",
  "theme_color": "#78716c",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Step 4: Add Meta Tags to src/app/layout.tsx

Add the following inside the `<head>` or in the `metadata` export:

```typescript
export const metadata: Metadata = {
  title: "Digital Filofax",
  description: "Your personal digital organizer",
  manifest: "/manifest.json",
  themeColor: "#78716c",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Digital Filofax",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};
```

### Step 5: Add App Icons

Place icon files in the `public/` directory:
- `public/icon-192x192.png` (192x192 px)
- `public/icon-512x512.png` (512x512 px)
- `public/apple-touch-icon.png` (180x180 px, for iOS)

### Step 6: Add to Home Screen (iOS)

1. Open your deployed app URL in Safari on iOS
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Name it "Filofax" (or keep the default)
5. Tap **Add**

The app will launch in standalone mode (no Safari chrome), behaving like a native app.

### Step 7: Add to Home Screen (Android)

1. Open your deployed app URL in Chrome on Android
2. Chrome will show an "Add to Home Screen" banner automatically
3. Or tap the three-dot menu > **Add to Home Screen** / **Install app**

---

## Troubleshooting

### Build fails on Vercel with Prisma errors
Ensure `prisma generate` runs before `next build`. Vercel's default build command (`next build`) should work because Prisma's `postinstall` hook runs `prisma generate` automatically. If not, set the build command to:
```
npx prisma generate && npm run build
```

### OAuth login redirects to wrong URL
Make sure `AUTH_URL` exactly matches your deployment URL (including `https://` and no trailing slash). Redeploy after changing it.

### Database connection timeouts on Vercel
Use the pooled connection string (port 6543) for `DATABASE_URL` and the direct connection (port 5432) for `DIRECT_URL`. Supabase's connection pooler (PgBouncer) is required for serverless environments.

### "NEXTAUTH_URL" vs "AUTH_URL"
NextAuth v5 beta uses `AUTH_URL` (not `NEXTAUTH_URL`). The project is configured for v5.
