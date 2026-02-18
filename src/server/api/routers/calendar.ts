import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export const calendarRouter = createTRPCRouter({
  getEvents: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        sources: z.array(z.enum(["INTERNAL", "GOOGLE_CALENDAR", "GITHUB"])).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.calendarEvent.findMany({
        where: {
          userId: ctx.session.user.id,
          OR: [
            {
              startDate: {
                gte: input.startDate,
                lte: input.endDate,
              },
            },
            {
              endDate: {
                gte: input.startDate,
                lte: input.endDate,
              },
            },
            {
              AND: [
                { startDate: { lte: input.startDate } },
                { endDate: { gte: input.endDate } },
              ],
            },
          ],
          ...(input.sources && { source: { in: input.sources } }),
        },
        orderBy: { startDate: "asc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.calendarEvent.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      return event;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(5000).optional(),
        startDate: z.date(),
        endDate: z.date(),
        allDay: z.boolean().default(false),
        location: z.string().max(500).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        recurrenceRule: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate end date is after start date
      if (input.endDate < input.startDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End date must be after start date",
        });
      }

      return ctx.db.calendarEvent.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
          source: "INTERNAL",
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().max(5000).nullable().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        allDay: z.boolean().optional(),
        location: z.string().max(500).nullable().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
        recurrenceRule: z.string().max(500).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const existing = await ctx.db.calendarEvent.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Can only edit internal events
      if (existing.source !== "INTERNAL") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot edit events from external sources",
        });
      }

      // Validate dates if both are provided
      const newStartDate = updateData.startDate ?? existing.startDate;
      const newEndDate = updateData.endDate ?? existing.endDate;
      if (newEndDate < newStartDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End date must be after start date",
        });
      }

      return ctx.db.calendarEvent.update({
        where: { id },
        data: updateData,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.calendarEvent.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Can only delete internal events
      if (existing.source !== "INTERNAL") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete events from external sources",
        });
      }

      await ctx.db.calendarEvent.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // Quick reschedule (drag and drop)
  reschedule: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.calendarEvent.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      if (existing.source !== "INTERNAL") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot reschedule events from external sources",
        });
      }

      return ctx.db.calendarEvent.update({
        where: { id: input.id },
        data: {
          startDate: input.startDate,
          endDate: input.endDate,
        },
      });
    }),

  // Get today's events
  getToday: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    return ctx.db.calendarEvent.findMany({
      where: {
        userId: ctx.session.user.id,
        OR: [
          {
            startDate: {
              gte: startOfDay(today),
              lte: endOfDay(today),
            },
          },
          {
            AND: [
              { startDate: { lte: startOfDay(today) } },
              { endDate: { gte: endOfDay(today) } },
            ],
          },
        ],
      },
      orderBy: { startDate: "asc" },
    });
  }),

  // Get this week's events
  getThisWeek: protectedProcedure
    .input(z.object({ weekStartsOn: z.number().min(0).max(6).default(1) }).optional())
    .query(async ({ ctx, input }) => {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: (input?.weekStartsOn ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
      const weekEnd = endOfWeek(today, { weekStartsOn: (input?.weekStartsOn ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6 });

      return ctx.db.calendarEvent.findMany({
        where: {
          userId: ctx.session.user.id,
          OR: [
            {
              startDate: {
                gte: weekStart,
                lte: weekEnd,
              },
            },
            {
              AND: [
                { startDate: { lte: weekStart } },
                { endDate: { gte: weekEnd } },
              ],
            },
          ],
        },
        orderBy: { startDate: "asc" },
      });
    }),

  // Get this month's events
  getThisMonth: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    return ctx.db.calendarEvent.findMany({
      where: {
        userId: ctx.session.user.id,
        OR: [
          {
            startDate: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          {
            AND: [
              { startDate: { lte: monthStart } },
              { endDate: { gte: monthEnd } },
            ],
          },
        ],
      },
      orderBy: { startDate: "asc" },
    });
  }),

  // Get upcoming events
  getUpcoming: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const now = new Date();

      return ctx.db.calendarEvent.findMany({
        where: {
          userId: ctx.session.user.id,
          startDate: { gte: now },
        },
        orderBy: { startDate: "asc" },
        take: input.limit,
      });
    }),

  // Get combined view (events + tasks with due dates)
  getCombinedAgenda: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const [events, tasks] = await Promise.all([
        ctx.db.calendarEvent.findMany({
          where: {
            userId: ctx.session.user.id,
            OR: [
              {
                startDate: {
                  gte: input.startDate,
                  lte: input.endDate,
                },
              },
              {
                AND: [
                  { startDate: { lte: input.startDate } },
                  { endDate: { gte: input.endDate } },
                ],
              },
            ],
          },
          orderBy: { startDate: "asc" },
        }),
        ctx.db.task.findMany({
          where: {
            userId: ctx.session.user.id,
            dueDate: {
              gte: input.startDate,
              lte: input.endDate,
            },
            status: { not: "DONE" },
          },
          include: {
            category: true,
          },
          orderBy: { dueDate: "asc" },
        }),
      ]);

      // Convert to unified format for calendar display
      const calendarItems = [
        ...events.map((event) => ({
          id: event.id,
          title: event.title,
          start: event.startDate,
          end: event.endDate,
          allDay: event.allDay,
          type: "event" as const,
          color: event.color ?? "#3b82f6",
          source: event.source,
          data: event,
        })),
        ...tasks.map((task) => ({
          id: task.id,
          title: task.title,
          start: task.dueDate!,
          end: task.dueDate!,
          allDay: true,
          type: "task" as const,
          color: task.category?.color ?? "#6366f1",
          source: "INTERNAL" as const,
          data: task,
        })),
      ];

      return calendarItems.sort((a, b) => a.start.getTime() - b.start.getTime());
    }),
});
