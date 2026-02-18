import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { startOfWeek } from "date-fns";

export const rolesRouter = createTRPCRouter({
  // ============================================================================
  // LIFE ROLES
  // ============================================================================

  getAllRoles: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.lifeRole.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: {
            weeklyBigRocks: true,
          },
        },
      },
    });
  }),

  getRoleById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const role = await ctx.db.lifeRole.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          weeklyBigRocks: {
            orderBy: { weekOf: "desc" },
            take: 10,
          },
        },
      });

      if (!role) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
      }

      return role;
    }),

  createRole: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(2000).optional(),
        icon: z.string().max(50).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.lifeRole.findFirst({
        where: {
          userId: ctx.session.user.id,
          name: { equals: input.name, mode: "insensitive" },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A role with this name already exists",
        });
      }

      const maxOrder = await ctx.db.lifeRole.aggregate({
        where: { userId: ctx.session.user.id },
        _max: { order: true },
      });

      return ctx.db.lifeRole.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
          order: (maxOrder._max.order ?? 0) + 1,
        },
      });
    }),

  updateRole: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(2000).nullable().optional(),
        icon: z.string().max(50).nullable().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const existing = await ctx.db.lifeRole.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
      }

      if (updateData.name) {
        const duplicate = await ctx.db.lifeRole.findFirst({
          where: {
            userId: ctx.session.user.id,
            name: { equals: updateData.name, mode: "insensitive" },
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A role with this name already exists",
          });
        }
      }

      return ctx.db.lifeRole.update({
        where: { id },
        data: updateData,
      });
    }),

  deleteRole: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.lifeRole.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
      }

      await ctx.db.lifeRole.delete({ where: { id: input.id } });

      return { success: true };
    }),

  reorderRoles: protectedProcedure
    .input(
      z.object({
        roles: z.array(
          z.object({
            id: z.string(),
            order: z.number(),
          })
        ).max(50),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.roles.map((role) =>
          ctx.db.lifeRole.updateMany({
            where: { id: role.id, userId: ctx.session.user.id },
            data: { order: role.order },
          })
        )
      );

      return { success: true };
    }),

  // ============================================================================
  // WEEKLY BIG ROCKS
  // ============================================================================

  getBigRocksForWeek: protectedProcedure
    .input(
      z.object({
        weekOf: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const weekDate = input.weekOf ?? new Date();
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });

      return ctx.db.weeklyBigRock.findMany({
        where: {
          userId: ctx.session.user.id,
          weekOf: weekStart,
        },
        include: {
          role: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    }),

  createBigRock: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        roleId: z.string(),
        weekOf: z.date().optional(),
        linkedTaskId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const role = await ctx.db.lifeRole.findFirst({
        where: { id: input.roleId, userId: ctx.session.user.id },
      });

      if (!role) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
      }

      const weekDate = input.weekOf ?? new Date();
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });

      return ctx.db.weeklyBigRock.create({
        data: {
          title: input.title,
          roleId: input.roleId,
          weekOf: weekStart,
          linkedTaskId: input.linkedTaskId,
          userId: ctx.session.user.id,
        },
        include: {
          role: true,
        },
      });
    }),

  updateBigRock: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        completed: z.boolean().optional(),
        linkedTaskId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const existing = await ctx.db.weeklyBigRock.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Big rock not found",
        });
      }

      const data: Record<string, unknown> = { ...updateData };

      if (updateData.completed !== undefined) {
        data.completedAt = updateData.completed ? new Date() : null;
      }

      return ctx.db.weeklyBigRock.update({
        where: { id },
        data,
        include: {
          role: true,
        },
      });
    }),

  toggleBigRockComplete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.weeklyBigRock.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Big rock not found",
        });
      }

      const newCompleted = !existing.completed;

      return ctx.db.weeklyBigRock.update({
        where: { id: input.id },
        data: {
          completed: newCompleted,
          completedAt: newCompleted ? new Date() : null,
        },
        include: {
          role: true,
        },
      });
    }),

  deleteBigRock: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.weeklyBigRock.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Big rock not found",
        });
      }

      await ctx.db.weeklyBigRock.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // ============================================================================
  // WEEKLY COMPASS
  // ============================================================================

  getWeeklyCompass: protectedProcedure
    .input(
      z.object({
        weekOf: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const weekDate = input.weekOf ?? new Date();
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });

      const roles = await ctx.db.lifeRole.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { order: "asc" },
        include: {
          weeklyBigRocks: {
            where: {
              weekOf: weekStart,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      const totalBigRocks = roles.reduce(
        (sum, role) => sum + role.weeklyBigRocks.length,
        0
      );
      const completedBigRocks = roles.reduce(
        (sum, role) =>
          sum + role.weeklyBigRocks.filter((br) => br.completed).length,
        0
      );

      return {
        roles,
        weekStart,
        totalBigRocks,
        completedBigRocks,
        completionRate:
          totalBigRocks > 0 ? (completedBigRocks / totalBigRocks) * 100 : 0,
      };
    }),
});
