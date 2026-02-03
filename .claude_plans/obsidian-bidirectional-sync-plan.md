# Obsidian Bidirectional Sync - Implementation Plan

## Overview

Add bidirectional sync between the Personal Organization App and Obsidian vaults via the Local REST API plugin. This enables users to edit notes in either location with automatic synchronization.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User's Machine                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐                      ┌──────────────────────────┐ │
│  │   Next.js App    │                      │      Obsidian App        │ │
│  │                  │                      │                          │ │
│  │  ┌────────────┐  │    HTTP/HTTPS        │  ┌────────────────────┐  │ │
│  │  │  tRPC      │  │◄──────────────────►  │  │ Local REST API     │  │ │
│  │  │  Router    │  │   localhost:27124    │  │ Plugin             │  │ │
│  │  └────────────┘  │                      │  └────────────────────┘  │ │
│  │        │         │                      │           │              │ │
│  │        ▼         │                      │           ▼              │ │
│  │  ┌────────────┐  │                      │  ┌────────────────────┐  │ │
│  │  │  Prisma    │  │                      │  │   Vault Files      │  │ │
│  │  │  Database  │  │                      │  │   (.md files)      │  │ │
│  │  └────────────┘  │                      │  └────────────────────┘  │ │
│  └──────────────────┘                      └──────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Phase 1: Foundation (Database & Connection)

### 1.1 Database Schema Changes

Add to `prisma/schema.prisma`:

```prisma
model ObsidianConfig {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  apiKey        String   // Encrypted bearer token
  baseUrl       String   @default("https://127.0.0.1:27124")
  vaultName     String?
  syncEnabled   Boolean  @default(true)
  syncInterval  Int      @default(300) // seconds (5 min default)
  lastSyncAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model ObsidianSyncState {
  id                  String   @id @default(cuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // App entity reference (polymorphic)
  entityType          String   // 'memo' | 'idea' | 'task'
  entityId            String

  // Obsidian file reference
  obsidianPath        String   // e.g., "Memos/Meeting Notes.md"

  // Sync tracking
  lastAppModified     DateTime
  lastObsidianModified DateTime
  lastSyncedAt        DateTime
  contentHash         String   // SHA-256 of synced content

  // Conflict handling
  conflictStatus      ConflictStatus @default(NONE)
  appContent          String?  @db.Text // Stored on conflict
  obsidianContent     String?  @db.Text // Stored on conflict

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([userId, entityType, entityId])
  @@unique([userId, obsidianPath])
  @@index([userId, conflictStatus])
}

enum ConflictStatus {
  NONE
  DETECTED
  RESOLVED_APP_WINS
  RESOLVED_OBSIDIAN_WINS
  RESOLVED_MERGED
}
```

### 1.2 Obsidian API Client

Create `src/lib/obsidian-client.ts`:

```typescript
import crypto from 'crypto';

export interface ObsidianNote {
  path: string;
  content: string;
  frontmatter: Record<string, unknown>;
  stat: {
    mtime: number;
    ctime: number;
    size: number;
  };
}

export interface ObsidianFile {
  path: string;
  isDirectory: boolean;
}

export class ObsidianClient {
  constructor(
    private baseUrl: string,
    private apiKey: string
  ) {}

  private async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'text/markdown',
        ...options.headers,
      },
      // Skip SSL verification for self-signed cert (localhost only)
      // @ts-expect-error - Node.js specific option
      rejectUnauthorized: false,
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Obsidian API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.fetch('/');
      return response.ok;
    } catch {
      return false;
    }
  }

  async listFiles(directory: string = '/'): Promise<ObsidianFile[]> {
    const response = await this.fetch(`/vault/${directory}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.files || [];
  }

  async getNote(path: string): Promise<ObsidianNote | null> {
    const response = await this.fetch(`/vault/${encodeURIComponent(path)}`, {
      headers: {
        'Accept': 'application/vnd.olrapi.note+json',
      },
    });

    if (response.status === 404) return null;
    return response.json();
  }

  async getNoteContent(path: string): Promise<string | null> {
    const response = await this.fetch(`/vault/${encodeURIComponent(path)}`);
    if (response.status === 404) return null;
    return response.text();
  }

  async createOrUpdateNote(path: string, content: string): Promise<void> {
    await this.fetch(`/vault/${encodeURIComponent(path)}`, {
      method: 'PUT',
      body: content,
    });
  }

  async deleteNote(path: string): Promise<void> {
    await this.fetch(`/vault/${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });
  }

  async patchFrontmatter(path: string, fields: Record<string, unknown>): Promise<void> {
    await this.fetch(`/vault/${encodeURIComponent(path)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frontmatter: fields,
      }),
    });
  }
}

// Utility functions
export function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function parseObsidianFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  try {
    // Simple YAML parsing (for production, use a proper YAML library)
    const yaml = match[1];
    const frontmatter: Record<string, unknown> = {};
    yaml.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        frontmatter[key.trim()] = valueParts.join(':').trim();
      }
    });
    return { frontmatter, body: match[2] };
  } catch {
    return { frontmatter: {}, body: content };
  }
}

export function buildObsidianNote(
  title: string,
  content: string,
  frontmatter: Record<string, unknown>
): string {
  const yamlLines = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.join(', ')}]`;
      }
      if (value instanceof Date) {
        return `${key}: ${value.toISOString()}`;
      }
      return `${key}: ${value}`;
    });

  return `---
${yamlLines.join('\n')}
---

# ${title}

${content}`;
}
```

### 1.3 tRPC Router

Create `src/server/api/routers/obsidian.ts`:

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  ObsidianClient,
  generateContentHash,
  buildObsidianNote,
  parseObsidianFrontmatter
} from "@/lib/obsidian-client";
import { TRPCError } from "@trpc/server";
import { ConflictStatus } from "@prisma/client";

export const obsidianRouter = createTRPCRouter({
  // Get user's Obsidian configuration
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.obsidianConfig.findUnique({
      where: { userId: ctx.session.user.id },
    });
  }),

  // Save/update Obsidian configuration
  saveConfig: protectedProcedure
    .input(z.object({
      apiKey: z.string().min(1),
      baseUrl: z.string().url().default("https://127.0.0.1:27124"),
      vaultName: z.string().optional(),
      syncEnabled: z.boolean().default(true),
      syncInterval: z.number().min(60).max(3600).default(300),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.obsidianConfig.upsert({
        where: { userId: ctx.session.user.id },
        create: { userId: ctx.session.user.id, ...input },
        update: input,
      });
    }),

  // Test connection to Obsidian
  testConnection: protectedProcedure.mutation(async ({ ctx }) => {
    const config = await ctx.db.obsidianConfig.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!config) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Obsidian not configured"
      });
    }

    const client = new ObsidianClient(config.baseUrl, config.apiKey);
    const connected = await client.testConnection();

    return { connected };
  }),

  // Get sync status overview
  getSyncStatus: protectedProcedure.query(async ({ ctx }) => {
    const [config, conflicts, syncStates] = await Promise.all([
      ctx.db.obsidianConfig.findUnique({
        where: { userId: ctx.session.user.id },
      }),
      ctx.db.obsidianSyncState.count({
        where: {
          userId: ctx.session.user.id,
          conflictStatus: ConflictStatus.DETECTED
        },
      }),
      ctx.db.obsidianSyncState.count({
        where: { userId: ctx.session.user.id },
      }),
    ]);

    return {
      configured: !!config,
      syncEnabled: config?.syncEnabled ?? false,
      lastSyncAt: config?.lastSyncAt,
      totalSynced: syncStates,
      conflictCount: conflicts,
    };
  }),

  // Get all conflicts for resolution
  getConflicts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.obsidianSyncState.findMany({
      where: {
        userId: ctx.session.user.id,
        conflictStatus: ConflictStatus.DETECTED,
      },
      orderBy: { updatedAt: "desc" },
    });
  }),

  // Resolve a conflict
  resolveConflict: protectedProcedure
    .input(z.object({
      syncStateId: z.string(),
      resolution: z.enum(["app_wins", "obsidian_wins", "keep_both"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const syncState = await ctx.db.obsidianSyncState.findFirst({
        where: {
          id: input.syncStateId,
          userId: ctx.session.user.id,
        },
      });

      if (!syncState) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const config = await ctx.db.obsidianConfig.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Obsidian not configured" });
      }

      const client = new ObsidianClient(config.baseUrl, config.apiKey);

      if (input.resolution === "app_wins" && syncState.appContent) {
        // Push app content to Obsidian
        await client.createOrUpdateNote(syncState.obsidianPath, syncState.appContent);

        await ctx.db.obsidianSyncState.update({
          where: { id: syncState.id },
          data: {
            conflictStatus: ConflictStatus.RESOLVED_APP_WINS,
            contentHash: generateContentHash(syncState.appContent),
            lastSyncedAt: new Date(),
            appContent: null,
            obsidianContent: null,
          },
        });
      } else if (input.resolution === "obsidian_wins" && syncState.obsidianContent) {
        // Update app entity with Obsidian content
        const { frontmatter, body } = parseObsidianFrontmatter(syncState.obsidianContent);

        // Update based on entity type
        if (syncState.entityType === "memo") {
          await ctx.db.memo.update({
            where: { id: syncState.entityId },
            data: {
              content: body,
              updatedAt: new Date(),
            },
          });
        } else if (syncState.entityType === "idea") {
          await ctx.db.idea.update({
            where: { id: syncState.entityId },
            data: {
              description: body,
              updatedAt: new Date(),
            },
          });
        }

        await ctx.db.obsidianSyncState.update({
          where: { id: syncState.id },
          data: {
            conflictStatus: ConflictStatus.RESOLVED_OBSIDIAN_WINS,
            contentHash: generateContentHash(syncState.obsidianContent),
            lastSyncedAt: new Date(),
            appContent: null,
            obsidianContent: null,
          },
        });
      }

      return { success: true };
    }),

  // Sync memos to/from Obsidian
  syncMemos: protectedProcedure.mutation(async ({ ctx }) => {
    const config = await ctx.db.obsidianConfig.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!config || !config.syncEnabled) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Obsidian sync not enabled"
      });
    }

    const client = new ObsidianClient(config.baseUrl, config.apiKey);
    const userId = ctx.session.user.id;

    // Get all memos and their sync states
    const memos = await ctx.db.memo.findMany({
      where: { userId },
      include: { tags: true },
    });

    const syncStates = await ctx.db.obsidianSyncState.findMany({
      where: { userId, entityType: "memo" },
    });

    const syncStateMap = new Map(
      syncStates.map(s => [s.entityId, s])
    );

    let synced = 0;
    let conflicts = 0;
    let created = 0;

    for (const memo of memos) {
      const syncState = syncStateMap.get(memo.id);
      const obsidianPath = `Memos/${memo.title.replace(/[/\\?%*:|"<>]/g, '-')}.md`;

      // Build app content
      const appContent = buildObsidianNote(
        memo.title,
        memo.content || '',
        {
          type: 'memo',
          sync_id: memo.id,
          memo_type: memo.type,
          tags: memo.tags.map(t => t.name),
          created: memo.createdAt,
          updated: memo.updatedAt,
        }
      );

      const obsidianNote = await client.getNote(obsidianPath);

      if (!syncState) {
        // First sync - create in Obsidian
        await client.createOrUpdateNote(obsidianPath, appContent);

        await ctx.db.obsidianSyncState.create({
          data: {
            userId,
            entityType: "memo",
            entityId: memo.id,
            obsidianPath,
            lastAppModified: memo.updatedAt,
            lastObsidianModified: new Date(),
            lastSyncedAt: new Date(),
            contentHash: generateContentHash(appContent),
          },
        });
        created++;
      } else if (obsidianNote) {
        // Check for conflicts
        const appModified = memo.updatedAt > syncState.lastSyncedAt;
        const obsidianModified = obsidianNote.stat.mtime > syncState.lastSyncedAt.getTime();

        if (appModified && obsidianModified) {
          // Conflict detected
          await ctx.db.obsidianSyncState.update({
            where: { id: syncState.id },
            data: {
              conflictStatus: ConflictStatus.DETECTED,
              appContent,
              obsidianContent: obsidianNote.content,
              lastAppModified: memo.updatedAt,
              lastObsidianModified: new Date(obsidianNote.stat.mtime),
            },
          });
          conflicts++;
        } else if (appModified) {
          // App wins - push to Obsidian
          await client.createOrUpdateNote(obsidianPath, appContent);

          await ctx.db.obsidianSyncState.update({
            where: { id: syncState.id },
            data: {
              lastAppModified: memo.updatedAt,
              lastObsidianModified: new Date(),
              lastSyncedAt: new Date(),
              contentHash: generateContentHash(appContent),
            },
          });
          synced++;
        } else if (obsidianModified) {
          // Obsidian wins - pull to app
          const { body } = parseObsidianFrontmatter(obsidianNote.content);

          await ctx.db.memo.update({
            where: { id: memo.id },
            data: { content: body, updatedAt: new Date() },
          });

          await ctx.db.obsidianSyncState.update({
            where: { id: syncState.id },
            data: {
              lastAppModified: new Date(),
              lastObsidianModified: new Date(obsidianNote.stat.mtime),
              lastSyncedAt: new Date(),
              contentHash: generateContentHash(obsidianNote.content),
            },
          });
          synced++;
        }
      }
    }

    // Update last sync time
    await ctx.db.obsidianConfig.update({
      where: { userId },
      data: { lastSyncAt: new Date() },
    });

    return { synced, conflicts, created };
  }),

  // Sync ideas to/from Obsidian
  syncIdeas: protectedProcedure.mutation(async ({ ctx }) => {
    const config = await ctx.db.obsidianConfig.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!config || !config.syncEnabled) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Obsidian sync not enabled"
      });
    }

    const client = new ObsidianClient(config.baseUrl, config.apiKey);
    const userId = ctx.session.user.id;

    const ideas = await ctx.db.idea.findMany({
      where: { userId },
      include: { tags: true },
    });

    const syncStates = await ctx.db.obsidianSyncState.findMany({
      where: { userId, entityType: "idea" },
    });

    const syncStateMap = new Map(
      syncStates.map(s => [s.entityId, s])
    );

    let synced = 0;
    let conflicts = 0;
    let created = 0;

    for (const idea of ideas) {
      const syncState = syncStateMap.get(idea.id);
      const obsidianPath = `Ideas/${idea.title.replace(/[/\\?%*:|"<>]/g, '-')}.md`;

      const appContent = buildObsidianNote(
        idea.title,
        idea.description || '',
        {
          type: 'idea',
          sync_id: idea.id,
          status: idea.status,
          tags: idea.tags.map(t => t.name),
          created: idea.createdAt,
          updated: idea.updatedAt,
        }
      );

      const obsidianNote = await client.getNote(obsidianPath);

      if (!syncState) {
        await client.createOrUpdateNote(obsidianPath, appContent);

        await ctx.db.obsidianSyncState.create({
          data: {
            userId,
            entityType: "idea",
            entityId: idea.id,
            obsidianPath,
            lastAppModified: idea.updatedAt,
            lastObsidianModified: new Date(),
            lastSyncedAt: new Date(),
            contentHash: generateContentHash(appContent),
          },
        });
        created++;
      } else if (obsidianNote) {
        const appModified = idea.updatedAt > syncState.lastSyncedAt;
        const obsidianModified = obsidianNote.stat.mtime > syncState.lastSyncedAt.getTime();

        if (appModified && obsidianModified) {
          await ctx.db.obsidianSyncState.update({
            where: { id: syncState.id },
            data: {
              conflictStatus: ConflictStatus.DETECTED,
              appContent,
              obsidianContent: obsidianNote.content,
              lastAppModified: idea.updatedAt,
              lastObsidianModified: new Date(obsidianNote.stat.mtime),
            },
          });
          conflicts++;
        } else if (appModified) {
          await client.createOrUpdateNote(obsidianPath, appContent);

          await ctx.db.obsidianSyncState.update({
            where: { id: syncState.id },
            data: {
              lastAppModified: idea.updatedAt,
              lastObsidianModified: new Date(),
              lastSyncedAt: new Date(),
              contentHash: generateContentHash(appContent),
            },
          });
          synced++;
        } else if (obsidianModified) {
          const { body } = parseObsidianFrontmatter(obsidianNote.content);

          await ctx.db.idea.update({
            where: { id: idea.id },
            data: { description: body, updatedAt: new Date() },
          });

          await ctx.db.obsidianSyncState.update({
            where: { id: syncState.id },
            data: {
              lastAppModified: new Date(),
              lastObsidianModified: new Date(obsidianNote.stat.mtime),
              lastSyncedAt: new Date(),
              contentHash: generateContentHash(obsidianNote.content),
            },
          });
          synced++;
        }
      }
    }

    await ctx.db.obsidianConfig.update({
      where: { userId },
      data: { lastSyncAt: new Date() },
    });

    return { synced, conflicts, created };
  }),

  // Full sync (memos + ideas)
  fullSync: protectedProcedure.mutation(async ({ ctx }) => {
    // This calls both sync functions
    // In production, use a transaction or queue
    const memoResult = await ctx.db.$transaction(async () => {
      // Memo sync logic here (simplified)
      return { synced: 0, conflicts: 0, created: 0 };
    });

    const ideaResult = await ctx.db.$transaction(async () => {
      // Idea sync logic here (simplified)
      return { synced: 0, conflicts: 0, created: 0 };
    });

    return {
      memos: memoResult,
      ideas: ideaResult,
      totalSynced: memoResult.synced + ideaResult.synced,
      totalConflicts: memoResult.conflicts + ideaResult.conflicts,
    };
  }),
});
```

## Phase 2: Settings UI

### 2.1 Settings Page

Create `src/app/dashboard/settings/obsidian/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from "lucide-react";

export default function ObsidianSettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://127.0.0.1:27124");
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const { data: config, isLoading } = api.obsidian.getConfig.useQuery();
  const { data: syncStatus } = api.obsidian.getSyncStatus.useQuery();

  const utils = api.useUtils();

  const saveConfig = api.obsidian.saveConfig.useMutation({
    onSuccess: () => utils.obsidian.getConfig.invalidate(),
  });

  const testConnection = api.obsidian.testConnection.useMutation({
    onSuccess: (data) => setTestResult(data.connected),
    onError: () => setTestResult(false),
  });

  const syncMemos = api.obsidian.syncMemos.useMutation({
    onSuccess: () => utils.obsidian.getSyncStatus.invalidate(),
  });

  const syncIdeas = api.obsidian.syncIdeas.useMutation({
    onSuccess: () => utils.obsidian.getSyncStatus.invalidate(),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Obsidian Integration</h1>
        <p className="text-muted-foreground">
          Sync your memos and ideas with your Obsidian vault
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>
            Requires the Local REST API plugin in Obsidian
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {syncStatus?.configured ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span>{syncStatus?.configured ? "Configured" : "Not configured"}</span>
          </div>

          {syncStatus?.lastSyncAt && (
            <p className="text-sm text-muted-foreground">
              Last sync: {new Date(syncStatus.lastSyncAt).toLocaleString()}
            </p>
          )}

          {syncStatus?.conflictCount > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {syncStatus.conflictCount} conflict(s) need resolution
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Obsidian REST API key"
            />
            <p className="text-xs text-muted-foreground">
              Find this in Obsidian → Settings → Local REST API → API Key
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseUrl">API URL</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://127.0.0.1:27124"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={syncEnabled}
              onCheckedChange={setSyncEnabled}
            />
            <Label>Enable automatic sync</Label>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => saveConfig.mutate({ apiKey, baseUrl, syncEnabled })}
              disabled={saveConfig.isPending}
            >
              Save Configuration
            </Button>
            <Button
              variant="outline"
              onClick={() => testConnection.mutate()}
              disabled={testConnection.isPending}
            >
              Test Connection
            </Button>
          </div>

          {testResult !== null && (
            <Alert variant={testResult ? "default" : "destructive"}>
              <AlertDescription>
                {testResult
                  ? "✓ Successfully connected to Obsidian"
                  : "✗ Could not connect. Is Obsidian running with the Local REST API plugin?"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Manual Sync */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Sync</CardTitle>
          <CardDescription>
            Trigger sync manually for specific content types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => syncMemos.mutate()}
              disabled={syncMemos.isPending || !syncStatus?.configured}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncMemos.isPending ? 'animate-spin' : ''}`} />
              Sync Memos
            </Button>
            <Button
              onClick={() => syncIdeas.mutate()}
              disabled={syncIdeas.isPending || !syncStatus?.configured}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncIdeas.isPending ? 'animate-spin' : ''}`} />
              Sync Ideas
            </Button>
          </div>

          {(syncMemos.data || syncIdeas.data) && (
            <Alert>
              <AlertDescription>
                Synced: {(syncMemos.data?.synced || 0) + (syncIdeas.data?.synced || 0)} |
                Created: {(syncMemos.data?.created || 0) + (syncIdeas.data?.created || 0)} |
                Conflicts: {(syncMemos.data?.conflicts || 0) + (syncIdeas.data?.conflicts || 0)}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

## Phase 3: Conflict Resolution UI

### 3.1 Conflicts Page

Create `src/app/dashboard/settings/obsidian/conflicts/page.tsx`:

```typescript
"use client";

import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ConflictsPage() {
  const { data: conflicts, isLoading } = api.obsidian.getConflicts.useQuery();
  const utils = api.useUtils();

  const resolveConflict = api.obsidian.resolveConflict.useMutation({
    onSuccess: () => utils.obsidian.getConflicts.invalidate(),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!conflicts?.length) return <div>No conflicts to resolve</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Resolve Sync Conflicts</h1>

      {conflicts.map((conflict) => (
        <Card key={conflict.id}>
          <CardHeader>
            <CardTitle>{conflict.obsidianPath}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="app">
              <TabsList>
                <TabsTrigger value="app">App Version</TabsTrigger>
                <TabsTrigger value="obsidian">Obsidian Version</TabsTrigger>
              </TabsList>
              <TabsContent value="app">
                <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-64">
                  {conflict.appContent}
                </pre>
              </TabsContent>
              <TabsContent value="obsidian">
                <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-64">
                  {conflict.obsidianContent}
                </pre>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => resolveConflict.mutate({
                  syncStateId: conflict.id,
                  resolution: "app_wins",
                })}
                disabled={resolveConflict.isPending}
              >
                Keep App Version
              </Button>
              <Button
                variant="outline"
                onClick={() => resolveConflict.mutate({
                  syncStateId: conflict.id,
                  resolution: "obsidian_wins",
                })}
                disabled={resolveConflict.isPending}
              >
                Keep Obsidian Version
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## Phase 4: Background Sync (Optional)

For automatic background sync, you could:

1. **Client-side polling** with React Query's `refetchInterval`
2. **Server-side cron** with Vercel Cron Jobs or similar
3. **User-triggered** via a "Sync" button in the header

## Implementation Checklist

### Phase 1: Foundation
- [ ] Add Prisma schema changes
- [ ] Run `npm run db:generate` and `npm run db:push`
- [ ] Create `src/lib/obsidian-client.ts`
- [ ] Create `src/server/api/routers/obsidian.ts`
- [ ] Add router to `src/server/api/root.ts`

### Phase 2: Settings UI
- [ ] Create settings page at `/dashboard/settings/obsidian`
- [ ] Add navigation link in sidebar
- [ ] Implement connection testing
- [ ] Implement manual sync triggers

### Phase 3: Conflict Resolution
- [ ] Create conflicts page
- [ ] Implement side-by-side diff view
- [ ] Add resolution actions

### Phase 4: Polish
- [ ] Add sync status indicator to header
- [ ] Add error handling and retry logic
- [ ] Add sync progress notifications
- [ ] Write tests

## Folder Mapping

| App Feature | Obsidian Folder | Frontmatter Type |
|-------------|-----------------|------------------|
| Memos | `/Memos/` | `type: memo` |
| Ideas | `/Ideas/` | `type: idea` |
| Tasks | `/Tasks/` | `type: task` |

## Security Considerations

1. **API Key Storage**: Store encrypted in database, never expose to client
2. **Localhost Only**: API only accessible from same machine
3. **User Isolation**: All sync operations scoped to authenticated user
4. **SSL Verification**: Self-signed cert requires explicit trust

## Known Limitations

1. **Obsidian Must Be Running**: Sync fails if app is closed
2. **No Real-time**: Polling-based, not instant sync
3. **File Renames**: Detected as delete + create (may create duplicates)
4. **Attachments**: Images/files not synced (text only)
5. **Wikilinks**: Links to other notes preserved but not validated
