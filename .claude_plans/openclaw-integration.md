# OpenClaw Integration Research

**Date**: 2026-02-23
**Researcher**: Technical Research Agent
**Status**: Research complete — integration feasible

---

## What is OpenClaw?

OpenClaw is an open-source, self-hosted personal AI assistant that acts as a proactive agent running on your own hardware. It was originally released as "Clawdbot" in November 2025, briefly renamed "Moltbot", and community-voted to "OpenClaw" on January 30, 2026. Its creator, Peter Steinberger (founder of PSPDFKit), announced on February 14, 2026 that he is joining OpenAI and transferring the project to an open-source foundation.

**GitHub**: https://github.com/openclaw/openclaw
**Stats (as of Feb 2026)**: ~140,000 stars, ~20,000 forks
**License**: Open-source (self-hosted, local-first)

### Core Concept

OpenClaw runs as a local gateway daemon on your machine (macOS, Linux, Windows/WSL2). Users interact with it through messaging platforms they already use — WhatsApp, Telegram, Slack, Discord, Signal, iMessage, Microsoft Teams, and others. The agent monitors your tools, automates workflows, and can be extended with community-built "Skills."

### Key Features

- **50+ channel integrations** — WhatsApp, Telegram, Slack, Discord, Signal, iMessage, Teams, Matrix, and more
- **100+ AgentSkills** — pre-built integrations for Notion, Obsidian, Todoist, Trello, GitHub, and productivity platforms
- **Voice capture** — always-on wake word with ElevenLabs voice support (macOS/iOS/Android)
- **Live Canvas** — interactive visual workspace (A2UI)
- **Model-agnostic** — supports Claude, GPT-4, Gemini, and local models (Ollama)
- **Privacy-first** — fully self-hosted, bring your own API keys
- **Skills Marketplace** — ClawHub registry with 3,000+ community skills
- **Webhook receiver** — external systems can POST to trigger agent actions

---

## Integration Architecture

OpenClaw exposes three extension points relevant to Digital Filofax:

### 1. Webhooks (Inbound: External System → OpenClaw)

When `hooks.enabled: true` is set in `~/.openclaw/openclaw.json`, the gateway exposes HTTP endpoints:

| Endpoint | Method | Purpose |
|---|---|---|
| `/hooks/wake` | POST | Enqueue a system event for the main agent session |
| `/hooks/agent` | POST | Launch an isolated agent turn (async, 202 response) |
| `/hooks/<name>` | POST | Custom mapped webhooks with payload transformation |

**Authentication**: Bearer token via `Authorization: Bearer <token>` header.

**Example: Digital Filofax notifying OpenClaw of an overdue task**

```http
POST http://localhost:18789/hooks/wake
Authorization: Bearer your-hook-token
Content-Type: application/json

{
  "text": "Task 'Quarterly review' is now overdue",
  "mode": "now"
}
```

**Example: Triggering an agent run from a Daily Planner event**

```http
POST http://localhost:18789/hooks/agent
Authorization: Bearer your-hook-token
Content-Type: application/json

{
  "message": "Summarise my incomplete tasks for today and send to Telegram",
  "deliver": true,
  "channel": "telegram",
  "agentId": "main"
}
```

### 2. Custom Skills (OpenClaw → Digital Filofax)

Skills teach OpenClaw how to call your app's API. A skill is a directory containing a `SKILL.md` (with YAML frontmatter and natural-language instructions) and optionally an `index.mjs` handler.

**Example skill structure for Digital Filofax:**

```
~/.openclaw/workspace/skills/digital-filofax/
  SKILL.md          # Instructions + API config
  index.mjs         # Fetch handlers calling tRPC HTTP endpoints
```

Since tRPC procedures are accessible over HTTP (Next.js exposes them at `/api/trpc/<router>.<procedure>`), skills can call them directly as standard REST-like POST requests.

**Example `SKILL.md` frontmatter:**

```yaml
---
name: digital-filofax
description: Manage tasks, habits, memos, goals, and contacts in Digital Filofax
homepage: https://your-filofax-instance.com
user-invocable: true
---

## Instructions

Use this skill to create, list, and update items in Digital Filofax.

### Create a task
POST /api/trpc/tasks.create with body: { title, priority, dueDate }
Use the FILOFAX_API_KEY env var as Bearer token for authentication.

### Add a quick capture / inbox item
POST /api/trpc/inbox.create with body: { content, sourceHint }
```

**Secrets injection** (in `openclaw.json`):

```json
{
  "skills": {
    "entries": {
      "digital-filofax": {
        "env": {
          "FILOFAX_BASE_URL": "https://your-instance.vercel.app",
          "FILOFAX_API_KEY": "your-api-key"
        }
      }
    }
  }
}
```

### 3. WebSocket Control Plane

The gateway also exposes a WebSocket at `ws://127.0.0.1:18789` for deeper programmatic control, but this is only relevant for Plugins (TypeScript/JavaScript gateway extensions), which is a more advanced integration path.

---

## What Data Could Be Synced

| Direction | Trigger | Data |
|---|---|---|
| Filofax → OpenClaw | Task created/overdue | Notify agent to remind user via Telegram/WhatsApp |
| Filofax → OpenClaw | Habit not completed by 8pm | Push nudge to user's phone via messaging channel |
| Filofax → OpenClaw | Daily planning ritual started | Request AI-generated day summary |
| OpenClaw → Filofax | User says "add task: review PR by Friday" | POST to `tasks.create` via skill |
| OpenClaw → Filofax | User says "I had a great insight: ..." | POST to `inbox.create` or `ideas.create` |
| OpenClaw → Filofax | User says "log mood: energised" | POST to `reflections.create` |
| OpenClaw → Filofax | User says "remind me someday to learn Rust" | POST to `someday.create` |
| OpenClaw → Filofax | User says "I completed my morning habit" | POST to `habits.logCompletion` |

---

## Authentication and API Key Requirements

### OpenClaw Side

- A `hooks.token` secret in `openclaw.json` — this is the Bearer token Digital Filofax uses when calling `/hooks/*` endpoints
- Skill secrets (`FILOFAX_BASE_URL`, `FILOFAX_API_KEY`) stored in `openclaw.json` under `skills.entries`

### Digital Filofax Side

The app currently uses NextAuth v5 session-based authentication. To support OpenClaw skill calls, a dedicated API key mechanism would need to be added. Options:

**Option A — Add a `UserApiKey` Prisma model and an `api-key` tRPC middleware:**
```prisma
model UserApiKey {
  id        String   @id @default(cuid())
  userId    String
  key       String   @unique
  label     String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

A new tRPC procedure type (`apiKeyProcedure`) would validate `Authorization: Bearer <key>` in the request header and resolve `ctx.session.user.id` from the key.

**Option B — Use NextAuth with a session token over HTTP (simpler short-term):**
Store the session token from `DEV_AUTH_BYPASS` or an explicit login and include it as a cookie. Less robust but requires no schema change.

Option A is the correct long-term approach for a production integration.

---

## How to Expose tRPC Endpoints to OpenClaw Skills

tRPC procedures in Next.js App Router are HTTP-accessible at `/api/trpc/<router>.<procedure>`. A skill's `index.mjs` can call them as standard POST requests:

```javascript
// ~/.openclaw/workspace/skills/digital-filofax/index.mjs
export async function createTask(params, ctx) {
  const baseUrl = ctx.secrets.FILOFAX_BASE_URL;
  const apiKey = ctx.secrets.FILOFAX_API_KEY;

  const response = await fetch(`${baseUrl}/api/trpc/tasks.create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      json: {
        title: params.title,
        priority: params.priority ?? "MEDIUM",
        dueDate: params.dueDate ?? null,
      }
    }),
  });

  const result = await response.json();
  return result.result?.data?.json;
}
```

Note the tRPC HTTP batch request format wraps the payload in `{ json: { ...input } }` and returns `result.result.data.json`.

---

## Filofax-Side Implementation Plan

If a full integration were built, here is the recommended build order:

### Phase 1 — Inbound Webhook Receiver (Filofax notifies OpenClaw)

1. Add `OPENCLAW_WEBHOOK_URL` and `OPENCLAW_WEBHOOK_TOKEN` to `.env`
2. Create a utility `src/lib/openclaw.ts` with a `notifyOpenClaw(text, mode?)` helper
3. Add optional webhook calls in mutation success paths of high-value routers: `tasks.create`, `habits.logCompletion`, `daily.getOrCreate`

This phase has zero schema changes and is entirely additive.

### Phase 2 — API Key Authentication for Skill Calls

1. Add `UserApiKey` model to `prisma/schema.prisma`
2. Create `src/server/api/routers/apiKeys.ts` router with `generate`, `list`, `revoke`
3. Add `/dashboard/settings/api-keys` page for key management
4. Extend tRPC context to resolve session from Bearer token header
5. Add `apiKeyProcedure` alongside `protectedProcedure`

### Phase 3 — OpenClaw Skill Package

1. Create `openclaw-skill/` directory with `SKILL.md` and `index.mjs`
2. Implement handlers: `createTask`, `createInboxItem`, `createIdea`, `createMemo`, `logHabit`, `createSomedayItem`, `addReflection`
3. Publish to ClawHub registry or document as a local workspace skill

---

## Effort Estimate

| Phase | Effort | Risk | Value |
|---|---|---|---|
| Phase 1 (Outbound webhook) | Low (2-4 hours) | Low | Medium — passive notifications |
| Phase 2 (API key auth) | Medium (1 day) | Low | High — enables inbound skill calls |
| Phase 3 (Skill package) | Medium (half-day) | Low | High — full natural language capture from any channel |

Total for a working end-to-end integration: approximately 2 days of development work.

---

## Relevant Existing Routers

The following Digital Filofax tRPC routers are the most valuable targets for OpenClaw skill integration:

| Router file | Key procedures for OpenClaw |
|---|---|
| `tasks.ts` | `create`, `getAll`, `update` (mark complete) |
| `inbox.ts` | `create` (quick capture from any channel) |
| `ideas.ts` | `create` |
| `memos.ts` | `create` |
| `habits.ts` | `logCompletion`, `getAll` |
| `someday.ts` | `create` |
| `reflections.ts` | `create` |
| `daily.ts` | `getOrCreate`, `getSummary` |
| `goals.ts` | `getAll` (for morning briefings) |

---

## Alternatives and Similar Integrations

If OpenClaw is not the right fit, the existing Obsidian bidirectional sync plan (`.claude_plans/obsidian-bidirectional-sync-plan.md`) covers a comparable natural-language-to-structured-data workflow. Other tools in the same category include:

- **n8n** — self-hosted workflow automation with a visual builder; better for scheduled/trigger-based flows without conversational AI
- **Zapier / Make** — hosted automation; easier setup but no local AI agent
- **Home Assistant** — overlapping in voice capture and local automation but not productivity-focused

OpenClaw is the strongest fit for **conversational, voice-first, always-available capture** to Digital Filofax because it matches the user behaviour pattern the Quick Capture feature (Cmd+J) is already designed around — it just extends that to WhatsApp, Telegram, and voice at any time, from any device.

---

## Sources

- [OpenClaw GitHub Repository](https://github.com/openclaw/openclaw)
- [OpenClaw Official Site](https://openclaw.ai/)
- [OpenClaw Webhook Documentation](https://docs.openclaw.ai/automation/webhook)
- [OpenClaw Skills Documentation](https://docs.openclaw.ai/tools/skills)
- [OpenClaw Wikipedia](https://en.wikipedia.org/wiki/OpenClaw)
- [What is OpenClaw? — DigitalOcean](https://www.digitalocean.com/resources/articles/what-is-openclaw)
- [Meet OpenClaw — VPSBG.eu](https://www.vpsbg.eu/blog/meet-openclaw-a-revolution-in-ai-workflow-automation)
- [OpenClaw Architecture Explained — ppaolo.substack.com](https://ppaolo.substack.com/p/openclaw-system-architecture-overview)
- [How to Build an OpenClaw Skill for Any REST API — ClawCloud](https://www.clawcloud.dev/news/how-to-build-an-openclaw-skill-for-any-rest-api-integration)
- [OpenClaw Webhooks External Integration Guide — zenvanriel.nl](https://zenvanriel.nl/ai-engineer-blog/openclaw-webhooks-external-integration-guide/)
- [OpenClaw Webhooks Guide — Hookdeck](https://hookdeck.com/webhooks/platforms/page/1/openclaw)
- [OpenClaw Complete Guide 2026 — NxCode](https://www.nxcode.io/resources/news/openclaw-complete-guide-2026)
- [OpenClaw Custom API Integration Guide — LumaDock](https://lumadock.com/tutorials/openclaw-custom-api-integration-guide)
- [GitHub: codehooks-openclaw-skill — RestDB](https://github.com/RestDB/codehooks-openclaw-skill)
- [GitHub: awesome-openclaw-skills — VoltAgent](https://github.com/VoltAgent/awesome-openclaw-skills)
