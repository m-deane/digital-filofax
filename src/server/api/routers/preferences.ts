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
      return existing;
    }

    // Create default preferences
    return ctx.db.userPreferences.create({
      data: {
        userId: ctx.session.user.id,
      },
    });
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
});
