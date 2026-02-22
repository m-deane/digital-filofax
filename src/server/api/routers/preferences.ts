import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { MODULE_IDS, type ModuleId } from "@/lib/modules";

const moduleIdSchema = z.enum(MODULE_IDS as unknown as [ModuleId, ...ModuleId[]]);

export const preferencesRouter = createTRPCRouter({
  // Get user preferences (creates default if not exists)
  get: protectedProcedure.query(async ({ ctx }) => {
    const existing = await ctx.db.userPreferences.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (existing) {
      return {
        ...existing,
        hasAiKey: !!existing.aiApiKey,
        aiApiKey: undefined,
      };
    }

    // Create default preferences
    const created = await ctx.db.userPreferences.create({
      data: {
        userId: ctx.session.user.id,
      },
    });

    return {
      ...created,
      hasAiKey: false,
      aiApiKey: undefined,
    };
  }),

  // Update general preferences
  update: protectedProcedure
    .input(
      z.object({
        theme: z.enum(["system", "light", "dark"]).optional(),
        defaultView: z.string().max(50).optional(),
        weekStartsOn: z.number().min(0).max(6).optional(),
        dashboardLayout: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userPreferences.upsert({
        where: { userId: ctx.session.user.id },
        update: input,
        create: {
          userId: ctx.session.user.id,
          ...input,
        },
      });
    }),

  // Update enabled modules
  updateEnabledModules: protectedProcedure
    .input(
      z.object({
        enabledModules: z.array(moduleIdSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userPreferences.upsert({
        where: { userId: ctx.session.user.id },
        update: {
          enabledModules: input.enabledModules,
        },
        create: {
          userId: ctx.session.user.id,
          enabledModules: input.enabledModules,
        },
      });
    }),

  // Toggle a single module on/off
  toggleModule: protectedProcedure
    .input(
      z.object({
        moduleId: moduleIdSchema,
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prefs = await ctx.db.userPreferences.findUnique({
        where: { userId: ctx.session.user.id },
      });

      const currentModules = prefs?.enabledModules ?? [
        "tasks",
        "habits",
        "memos",
        "ideas",
        "calendar",
      ];

      let newModules: string[];
      if (input.enabled) {
        newModules = [...new Set([...currentModules, input.moduleId])];
      } else {
        newModules = currentModules.filter((m) => m !== input.moduleId);
      }

      return ctx.db.userPreferences.upsert({
        where: { userId: ctx.session.user.id },
        update: {
          enabledModules: newModules,
        },
        create: {
          userId: ctx.session.user.id,
          enabledModules: newModules,
        },
      });
    }),

  // Update sidebar section order
  updateSectionOrder: protectedProcedure
    .input(
      z.object({
        sectionOrder: z.array(z.string().max(50)).max(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userPreferences.upsert({
        where: { userId: ctx.session.user.id },
        update: { sectionOrder: input.sectionOrder },
        create: {
          userId: ctx.session.user.id,
          sectionOrder: input.sectionOrder,
        },
      });
    }),

  // Update enabled widgets
  updateEnabledWidgets: protectedProcedure
    .input(
      z.object({
        enabledWidgets: z.array(z.string().max(100)).max(50),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userPreferences.upsert({
        where: { userId: ctx.session.user.id },
        update: {
          enabledWidgets: input.enabledWidgets,
        },
        create: {
          userId: ctx.session.user.id,
          enabledWidgets: input.enabledWidgets,
        },
      });
    }),

  // Update Pomodoro settings
  updatePomodoroSettings: protectedProcedure
    .input(
      z.object({
        pomodoroWorkMinutes: z.number().min(1).max(120).optional(),
        pomodoroShortBreakMinutes: z.number().min(1).max(60).optional(),
        pomodoroLongBreakMinutes: z.number().min(1).max(120).optional(),
        pomodoroSessionsUntilLong: z.number().min(1).max(10).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userPreferences.upsert({
        where: { userId: ctx.session.user.id },
        update: input,
        create: {
          userId: ctx.session.user.id,
          ...input,
        },
      });
    }),

  // Set default template for a capture type (e.g. MEMO, MEETING_NOTES)
  updateDefaultTemplate: protectedProcedure
    .input(
      z.object({
        templateType: z.string().max(50),
        templateId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prefs = await ctx.db.userPreferences.findUnique({
        where: { userId: ctx.session.user.id },
        select: { defaultTemplates: true },
      });

      const current = (prefs?.defaultTemplates as Record<string, string>) ?? {};
      if (input.templateId === null) {
        delete current[input.templateType];
      } else {
        current[input.templateType] = input.templateId;
      }

      await ctx.db.userPreferences.upsert({
        where: { userId: ctx.session.user.id },
        update: { defaultTemplates: current },
        create: { userId: ctx.session.user.id, defaultTemplates: current },
      });

      return { success: true };
    }),

  // Update AI API key
  updateAiApiKey: protectedProcedure
    .input(
      z.object({
        aiApiKey: z.string().max(200).nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.userPreferences.upsert({
        where: { userId: ctx.session.user.id },
        update: { aiApiKey: input.aiApiKey },
        create: {
          userId: ctx.session.user.id,
          aiApiKey: input.aiApiKey,
        },
      });

      return { success: true, hasAiKey: !!result.aiApiKey };
    }),
});
