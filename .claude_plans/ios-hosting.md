# iOS Hosting Options for Digital Filofax

**Date**: February 2026
**Stack**: Next.js 15 (App Router) + TypeScript + tRPC v11 + Prisma 6 + NextAuth v5 beta + Tailwind/shadcn + PostgreSQL (Supabase)

---

## Summary Table

| Approach | Server-Side Features Work? | App Store? | Effort | Recommended? |
|---|---|---|---|---|
| PWA (Safari Add to Home Screen) | Yes — fully | No | Low | **Primary recommendation** |
| PWA + Vercel (production setup) | Yes — fully | No | Low-Medium | **Complement to above** |
| Capacitor (Ionic) | Partial — needs major refactor | Yes | High | Only if App Store is required |
| Tauri v2 | No SSR — static export only | Yes (Mac App Store) | High | Not suitable |
| Expo / React Native | Full rewrite required | Yes | Very High | Not recommended |

---

## Option 1: PWA — Progressive Web App via Safari

### What It Is

A PWA lets users tap Share > Add to Home Screen in Safari on iOS, placing an icon on their home screen. The app opens in a standalone browser chrome-free window, behaving like a native app. No App Store required.

### What Changes Are Needed

**1. Add `app/manifest.ts`**

Next.js 15 App Router has built-in manifest support. Create this file:

```typescript
// src/app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Digital Filofax',
    short_name: 'Filofax',
    description: 'Your personal digital planner',
    start_url: '/dashboard/daily',
    display: 'standalone',
    background_color: '#fdfaf5',
    theme_color: '#1a1a2e',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
```

**2. Update `src/app/layout.tsx` with viewport and apple meta tags**

```typescript
export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  // ...existing
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Filofax',
  },
}
```

**3. Add app icons to `public/`**

Generate at minimum:
- `public/icon-192.png` (192x192)
- `public/icon-512.png` (512x512)
- `public/apple-icon.png` (180x180, for Apple Touch Icon)

Use a tool like [realfavicongenerator.net](https://realfavicongenerator.net).

**4. Add a Service Worker for offline support (optional but recommended)**

The official Next.js PWA guide recommends [Serwist](https://serwist.pages.dev/docs/next/getting-started) as the modern successor to `next-pwa`:

```bash
npm i @serwist/next && npm i -D serwist
```

Update `next.config.ts`:

```typescript
import withSerwist from '@serwist/next'

const withSerwistConfig = withSerwist({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
})

export default withSerwistConfig({
  reactStrictMode: true,
  // ...existing config
})
```

Note: Serwist currently requires webpack. Add `"webworker"` to `tsconfig.json` lib and `"@serwist/next/typings"` to types.

**5. Add iOS install prompt UI**

iOS Safari does not show an automatic install banner. Add a custom in-app prompt:

```typescript
// Detect iOS + not already installed
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
// Show "Tap Share > Add to Home Screen" instruction if isIOS && !isStandalone
```

### Server-Side Features

All server-side features work without any changes because the app runs on Vercel (or any Node.js host) as a full Next.js server. The user's browser simply loads the app via HTTPS — tRPC, NextAuth, Prisma, and Server Actions all continue to function identically.

### iOS PWA Limitations (as of early 2026)

| Feature | Status |
|---|---|
| Add to Home Screen | Manual via Safari Share sheet — no automatic prompt |
| Push notifications | Supported from iOS 16.4+, but only when installed to home screen |
| Background sync | Not supported on iOS Safari |
| Offline mode | Partial — requires service worker + cache strategy |
| Storage (Cache API) | ~50 MB limit; IndexedDB up to ~500 MB |
| Storage eviction | iOS may clear storage if app unused for several weeks (does not apply to home screen installs) |
| `beforeinstallprompt` event | Not fired on iOS Safari; Android Chrome only |
| Web Bluetooth / USB | Not supported |
| Geolocation | Supported |
| Camera / microphone | Supported with permissions |
| Dark mode | Supported via `prefers-color-scheme` |
| Status bar / safe area | Controllable via `viewport-fit=cover` + CSS env vars |

**Important**: As of iOS 16.4+, push notifications work for home-screen-installed PWAs using the standard Web Push API. iOS 17+ improved storage quotas. iOS 26 (announced 2025) makes every home-screen site default to opening as a web app.

### Effort

**Low.** The core PWA shell (manifest + icons + meta tags) takes a few hours. Adding a service worker with Serwist for offline caching adds another half-day. No architectural changes required.

---

## Option 2: PWA on Vercel — Production Setup

This is the same as Option 1 but addresses production deployment specifics. It is a complement, not an alternative.

### Additional Vercel Configuration

**`next.config.ts` security headers** (required for service workers):

```typescript
async headers() {
  return [
    {
      source: '/sw.js',
      headers: [
        { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
      ],
    },
  ]
},
```

**VAPID keys** for push notifications (store in Vercel environment variables):

```bash
npm install -g web-push
web-push generate-vapid-keys
```

**HTTPS**: Vercel provides HTTPS automatically. Service workers require HTTPS, so this is covered.

### Effort

**Low.** Deployment is unchanged — push to Vercel as normal. Add VAPID keys to env vars if push notifications are desired.

---

## Option 3: Capacitor (Ionic)

### What It Is

Capacitor wraps a web app in a native iOS (WKWebView) shell, allowing distribution via the Apple App Store. It provides access to native device APIs beyond what Safari exposes.

### The Core Problem

**Capacitor requires a static export. It cannot run a Next.js server.** The Capacitor app loads static HTML/JS/CSS files from disk inside the native WebView. This means:

- `output: 'export'` must be set in `next.config.ts`
- All API routes are removed from the bundle
- tRPC routers (which run as Next.js API route handlers) are eliminated
- NextAuth (which runs server-side) is eliminated
- Server Components with data fetching no longer work
- Image optimisation must be disabled

### What This Means for Digital Filofax

The entire server-side architecture must be extracted into a **separately deployed backend**:

1. The tRPC routers (`src/server/api/routers/` — 31 files) must be deployed as a standalone Node.js/Express/Fastify server or moved to Supabase Edge Functions.
2. NextAuth must be replaced or deployed separately. The existing `next-auth-capacitor` pattern requires significant custom session handling and has **known iOS incompatibility** with cookie-based auth (the HTTPS scheme limitation blocks standard cookie sharing on iOS).
3. All 42 Next.js pages must be converted from Server Components to Client Components with client-side data fetching.
4. The `next.config.ts` static export flag breaks `next/image` optimisation, middleware, API routes, rewrites, and ISR.

**The NextAuth + iOS cookie problem is particularly significant**: iOS prohibits the HTTPS scheme in Capacitor apps in a way that makes cookie-based sessions unreliable. The documented workaround (`hostname` subdomain sharing) is Android-only. For iOS specifically, a token-based auth flow (JWT in `Authorization` header rather than cookies) would be required, which means replacing NextAuth v5 beta entirely or maintaining two auth paths.

### Effort

**High.** This is effectively a partial rewrite of the data layer. Estimate:
- Extract and re-deploy tRPC backend: 3–5 days
- Replace NextAuth with a Capacitor-compatible auth strategy for iOS: 2–3 days
- Convert Server Components to client-side: 2–3 days
- Capacitor setup, Xcode configuration, provisioning: 1–2 days
- Testing on physical iOS device: ongoing

Total: 2–3 weeks minimum for a working implementation.

### Limitations

- Requires Apple Developer Program ($99/year)
- Requires macOS + Xcode for iOS builds
- App Store review process (typically 1–3 days, can be longer)
- App Store updates require re-submission and review
- All server features must live in a separately deployed backend
- Service workers do not function inside Capacitor's WKWebView (the native shell replaces that browser context)

### When to Use

Only if App Store distribution is a hard requirement and the development investment is justified. If the goal is simply "looks like an app on iOS", the PWA approach achieves this without the rewrite.

---

## Option 4: Tauri v2

### What It Is

Tauri v2 is a Rust-based desktop/mobile shell that embeds a system WebView. It supports iOS and Android in addition to desktop platforms. Unlike Capacitor, it uses Rust for native logic.

### The Core Problem

**Same fundamental constraint as Capacitor**: Tauri cannot run a Next.js server. The official Tauri documentation for Next.js explicitly states:

> "Use static exports by setting `output: 'export'`. Tauri doesn't support server-based solutions."

All the same issues as Capacitor apply: tRPC backend must be extracted, NextAuth must be replaced, SSR is eliminated.

### Additional Tauri-Specific Issues

- Tauri's iOS support is newer and less mature than Capacitor's. The iOS alpha was released in 2023 and v2 stable shipped in late 2024.
- Native logic is written in Rust, not JavaScript/TypeScript — a completely different language from the existing stack.
- The community ecosystem for Tauri + Next.js on iOS is significantly smaller than Capacitor.
- iOS App Store distribution still requires Apple Developer Program + Xcode + macOS.
- Less documentation and community solutions for the auth/SSR problem compared to Capacitor.

### Effort

**High.** Comparable to Capacitor, but with the added complexity of Rust for any native features.

### Verdict

Tauri is better suited for desktop apps where its Rust-based security model and small binary size are advantages. For a web-first personal organiser targeting iOS, it offers no advantages over Capacitor and adds Rust complexity.

---

## Option 5: Expo / React Native

### What It Is

A full React Native rewrite where the UI is rebuilt using native components. Not a web wrapper.

### Assessment

A full rewrite of 42 pages, 31 tRPC routers, the Prisma data layer, and all UI components is not viable as an incremental path from the current codebase. Expo can share some business logic but not React DOM components, shadcn/ui, Radix UI, or Tailwind-based layouts.

**Effort: Very High.** Estimate 3–6 months of dedicated work for a single developer. Not recommended.

---

## Recommendation

### Primary: PWA on Vercel

**Implement the PWA path.** It requires no architectural changes, all server-side features (tRPC, NextAuth, Prisma) continue to work without modification, and it achieves the core goal of an app-like experience on iOS.

The implementation checklist:

1. Create `src/app/manifest.ts` with correct `start_url`, `display: 'standalone'`, icons, and theme colours.
2. Add `appleWebApp` metadata and `viewport` export to `src/app/layout.tsx`.
3. Generate and add icons to `public/`: 192px, 512px (maskable), 180px Apple Touch Icon.
4. Add an in-app iOS install prompt component (since Safari does not show an automatic banner).
5. Optionally add Serwist for offline caching of shell/static assets.
6. Ensure Vercel deployment has HTTPS (it does by default).

**Result**: Users visit the app URL in Safari, see the install prompt, tap Add to Home Screen, and get a fullscreen, chrome-free icon on their home screen that launches directly to `/dashboard/daily`. All existing functionality — auth, data sync, real-time updates — works identically to the browser version.

### If App Store Distribution Becomes a Hard Requirement

Re-evaluate Capacitor at that point, accepting the cost of extracting the tRPC backend into a standalone API server and replacing the cookie-based NextAuth session with a token-based flow. The frontend code (React components, Tailwind, hooks) would survive intact — only the server integration layer needs rearchitecting.

### What the PWA Does Not Provide

- App Store discoverability (no listing in the App Store)
- Push notifications to non-installed users (only works once added to home screen, iOS 16.4+)
- Access to native APIs beyond what Safari exposes (NFC, Bluetooth, USB, ARKit, etc.)
- Reliable background sync

For a personal organisation tool used by the owner, none of these are blocking concerns. The app is accessed by URL, not discovered via App Store, and the primary use case (daily planning, task entry, habit tracking) works fully online with the existing architecture.

---

## Implementation File Reference

Files to create or modify for the PWA path:

| File | Action |
|---|---|
| `src/app/manifest.ts` | Create — PWA manifest |
| `src/app/layout.tsx` | Modify — add `appleWebApp`, `viewport`, `apple-touch-icon` |
| `public/icon-192.png` | Add — 192x192 app icon |
| `public/icon-512.png` | Add — 512x512 app icon (also used as maskable) |
| `public/apple-icon.png` | Add — 180x180 Apple Touch Icon |
| `next.config.ts` | Modify — add service worker headers (if using Serwist) |
| `src/app/sw.ts` | Create — service worker entry point (if using Serwist) |
| `tsconfig.json` | Modify — add `webworker` to lib (if using Serwist) |

---

## Sources

- [Next.js Official PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Serwist for Next.js — Getting Started](https://serwist.pages.dev/docs/next/getting-started)
- [PWA on iOS — Current Status & Limitations (2025)](https://brainhub.eu/library/pwa-on-ios)
- [PWAs on iOS 2025: Real Capabilities vs. Hard Limitations](https://ravi6997.medium.com/pwas-on-ios-in-2025-why-your-web-app-might-beat-native-0b1c35acf845)
- [Converting Next.js to iOS with Capacitor 8](https://capgo.app/blog/building-a-native-mobile-app-with-nextjs-and-capacitor/)
- [Capacitor w/ Next.js & SSR — Ionic Forum](https://forum.ionicframework.com/t/capacitor-w-next-ssr/216810)
- [next-auth-capacitor — NextAuth + Capacitor workarounds](https://github.com/choutkamartin/next-auth-capacitor)
- [nextjs-native-trpc — Next.js + tRPC + Capacitor monorepo pattern](https://github.com/RobSchilderr/nextjs-native-trpc)
- [Tauri v2 Next.js Integration Guide](https://v2.tauri.app/start/frontend/nextjs/)
- [Tauri v2 App Store Distribution](https://v2.tauri.app/distribute/app-store/)
- [WebKit Storage Policy Updates](https://webkit.org/blog/14403/updates-to-storage-policy/)
- [MagicBell — PWA iOS Limitations and Safari Support](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
