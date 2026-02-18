import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const githubRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.gitHubRepo.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.isActive !== undefined && { isActive: input.isActive }),
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = await ctx.db.gitHubRepo.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!repo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found" });
      }

      return repo;
    }),

  create: protectedProcedure
    .input(
      z.object({
        owner: z.string().min(1).max(100),
        name: z.string().min(1).max(100),
        displayName: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const repoFullName = `${input.owner}/${input.name}`;

      // Check if repo already exists for this user
      const existing = await ctx.db.gitHubRepo.findFirst({
        where: {
          userId: ctx.session.user.id,
          repoFullName,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This repository is already connected",
        });
      }

      const repo = await ctx.db.gitHubRepo.create({
        data: {
          repoFullName,
          displayName: input.displayName,
          userId: ctx.session.user.id,
          isActive: true,
        },
      });

      return repo;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        displayName: z.string().max(200).optional(),
        isActive: z.boolean().optional(),
        integrationType: z.string().max(100).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const existing = await ctx.db.gitHubRepo.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found" });
      }

      const repo = await ctx.db.gitHubRepo.update({
        where: { id },
        data: updateData,
      });

      return repo;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.gitHubRepo.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found" });
      }

      await ctx.db.gitHubRepo.delete({ where: { id: input.id } });

      return { success: true };
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.gitHubRepo.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found" });
      }

      const repo = await ctx.db.gitHubRepo.update({
        where: { id: input.id },
        data: { isActive: !existing.isActive },
      });

      return repo;
    }),

  syncRepo: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.gitHubRepo.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found" });
      }

      // Update lastSyncAt timestamp
      const repo = await ctx.db.gitHubRepo.update({
        where: { id: input.id },
        data: { lastSyncAt: new Date() },
      });

      return repo;
    }),

  // Placeholder for fetching GitHub issues
  getIssues: protectedProcedure
    .input(
      z.object({
        repoId: z.string(),
        state: z.enum(["open", "closed", "all"]).default("open"),
      })
    )
    .query(async ({ ctx, input }) => {
      const repo = await ctx.db.gitHubRepo.findFirst({
        where: { id: input.repoId, userId: ctx.session.user.id },
      });

      if (!repo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found" });
      }

      // GitHub OAuth integration required to fetch real issues
      // See: https://docs.github.com/en/rest/issues
      return {
        repository: repo,
        issues: [] as Array<{ id: number; number: number; title: string; state: string; html_url: string; created_at: string; updated_at: string; labels: Array<{ name: string; color: string }> }>,
        totalCount: 0,
        integrationRequired: true,
      };
    }),

  // Placeholder for fetching GitHub pull requests
  getPullRequests: protectedProcedure
    .input(
      z.object({
        repoId: z.string(),
        state: z.enum(["open", "closed", "all"]).default("open"),
      })
    )
    .query(async ({ ctx, input }) => {
      const repo = await ctx.db.gitHubRepo.findFirst({
        where: { id: input.repoId, userId: ctx.session.user.id },
      });

      if (!repo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found" });
      }

      // GitHub OAuth integration required to fetch real pull requests
      // See: https://docs.github.com/en/rest/pulls
      return {
        repository: repo,
        pullRequests: [] as Array<{ id: number; number: number; title: string; state: string; html_url: string; created_at: string; updated_at: string; draft: boolean }>,
        totalCount: 0,
        integrationRequired: true,
      };
    }),

  // Get repository statistics
  getStats: protectedProcedure
    .input(z.object({ repoId: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = await ctx.db.gitHubRepo.findFirst({
        where: { id: input.repoId, userId: ctx.session.user.id },
      });

      if (!repo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found" });
      }

      // GitHub OAuth integration required for real statistics
      return {
        repository: repo,
        openIssues: 0,
        closedIssues: 0,
        openPRs: 0,
        closedPRs: 0,
        totalCommits: 0,
        lastActivity: repo.lastSyncAt ?? repo.updatedAt,
        integrationRequired: true,
      };
    }),
});
