import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const financeRouter = createTRPCRouter({
  // =============== TRANSACTIONS ===============
  getAllTransactions: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        type: z.enum(["INCOME", "EXPENSE"]).optional(),
        categoryId: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.transaction.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.type && { type: input.type }),
          ...(input?.categoryId && { categoryId: input.categoryId }),
          ...(input?.startDate && {
            date: { gte: input.startDate },
          }),
          ...(input?.endDate && {
            date: { lte: input.endDate },
          }),
        },
        include: {
          category: true,
        },
        orderBy: { date: "desc" },
      });
    }),

  createTransaction: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        type: z.enum(["INCOME", "EXPENSE"]),
        description: z.string().min(1).max(500),
        date: z.date(),
        categoryId: z.string().optional(),
        isRecurring: z.boolean().default(false),
        recurringRule: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction.create({
        data: {
          ...input,
          amount: new Prisma.Decimal(input.amount),
          userId: ctx.session.user.id,
        },
        include: {
          category: true,
        },
      });
    }),

  updateTransaction: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.number().positive().optional(),
        type: z.enum(["INCOME", "EXPENSE"]).optional(),
        description: z.string().min(1).max(500).optional(),
        date: z.date().optional(),
        categoryId: z.string().nullable().optional(),
        isRecurring: z.boolean().optional(),
        recurringRule: z.string().max(500).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, amount, ...rest } = input;

      const existing = await ctx.db.transaction.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found" });
      }

      return ctx.db.transaction.update({
        where: { id },
        data: {
          ...rest,
          ...(amount && { amount: new Prisma.Decimal(amount) }),
        },
        include: {
          category: true,
        },
      });
    }),

  deleteTransaction: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.transaction.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found" });
      }

      await ctx.db.transaction.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // =============== CATEGORIES ===============
  getAllCategories: protectedProcedure
    .input(
      z.object({
        type: z.enum(["INCOME", "EXPENSE"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.financeCategory.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.type && { type: input.type }),
        },
        include: {
          _count: {
            select: { transactions: true },
          },
        },
        orderBy: { name: "asc" },
      });
    }),

  createCategory: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        type: z.enum(["INCOME", "EXPENSE"]),
        icon: z.string().max(50).optional(),
        color: z.string().max(50).optional(),
        budgetLimit: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { budgetLimit, ...rest } = input;

      return ctx.db.financeCategory.create({
        data: {
          ...rest,
          ...(budgetLimit && { budgetLimit: new Prisma.Decimal(budgetLimit) }),
          userId: ctx.session.user.id,
        },
      });
    }),

  updateCategory: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        icon: z.string().max(50).nullable().optional(),
        color: z.string().max(50).optional(),
        budgetLimit: z.number().positive().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, budgetLimit, ...rest } = input;

      const existing = await ctx.db.financeCategory.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }

      return ctx.db.financeCategory.update({
        where: { id },
        data: {
          ...rest,
          ...(budgetLimit !== undefined && {
            budgetLimit: budgetLimit ? new Prisma.Decimal(budgetLimit) : null,
          }),
        },
      });
    }),

  deleteCategory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.financeCategory.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }

      await ctx.db.financeCategory.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // =============== SAVINGS GOALS ===============
  getAllSavingsGoals: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.savingsGoal.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: { deadline: "asc" },
    });
  }),

  createSavingsGoal: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        targetAmount: z.number().positive(),
        currentAmount: z.number().nonnegative().default(0),
        deadline: z.date().optional(),
        color: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { targetAmount, currentAmount, ...rest } = input;

      return ctx.db.savingsGoal.create({
        data: {
          ...rest,
          targetAmount: new Prisma.Decimal(targetAmount),
          currentAmount: new Prisma.Decimal(currentAmount),
          userId: ctx.session.user.id,
        },
      });
    }),

  updateSavingsGoal: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        targetAmount: z.number().positive().optional(),
        currentAmount: z.number().nonnegative().optional(),
        deadline: z.date().nullable().optional(),
        color: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, targetAmount, currentAmount, ...rest } = input;

      const existing = await ctx.db.savingsGoal.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Savings goal not found" });
      }

      return ctx.db.savingsGoal.update({
        where: { id },
        data: {
          ...rest,
          ...(targetAmount && { targetAmount: new Prisma.Decimal(targetAmount) }),
          ...(currentAmount !== undefined && { currentAmount: new Prisma.Decimal(currentAmount) }),
        },
      });
    }),

  addToSavingsGoal: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.db.savingsGoal.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!goal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Savings goal not found" });
      }

      const newAmount = goal.currentAmount.toNumber() + input.amount;

      return ctx.db.savingsGoal.update({
        where: { id: input.id },
        data: {
          currentAmount: new Prisma.Decimal(newAmount),
        },
      });
    }),

  deleteSavingsGoal: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.savingsGoal.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Savings goal not found" });
      }

      await ctx.db.savingsGoal.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // =============== STATISTICS ===============
  getMonthlyStats: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      const transactions = await ctx.db.transaction.findMany({
        where: {
          userId: ctx.session.user.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const income = transactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + t.amount.toNumber(), 0);

      const expenses = transactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + t.amount.toNumber(), 0);

      return {
        income,
        expenses,
        net: income - expenses,
        transactionCount: transactions.length,
      };
    }),

  getSpendingByCategory: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const transactions = await ctx.db.transaction.findMany({
        where: {
          userId: ctx.session.user.id,
          type: "EXPENSE",
          ...(input?.startDate && {
            date: { gte: input.startDate },
          }),
          ...(input?.endDate && {
            date: { lte: input.endDate },
          }),
        },
        include: {
          category: true,
        },
      });

      const byCategory = transactions.reduce((acc, t) => {
        const categoryName = t.category?.name || "Uncategorized";
        const categoryColor = t.category?.color || "#9ca3af";

        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            amount: 0,
            color: categoryColor,
            count: 0,
          };
        }

        acc[categoryName].amount += t.amount.toNumber();
        acc[categoryName].count += 1;

        return acc;
      }, {} as Record<string, { name: string; amount: number; color: string; count: number }>);

      return Object.values(byCategory).sort((a, b) => b.amount - a.amount);
    }),

  getBudgetStatus: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      const categories = await ctx.db.financeCategory.findMany({
        where: {
          userId: ctx.session.user.id,
          type: "EXPENSE",
          budgetLimit: { not: null },
        },
        include: {
          transactions: {
            where: {
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      });

      return categories.map((cat) => {
        const spent = cat.transactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);
        const limit = cat.budgetLimit?.toNumber() || 0;
        const remaining = limit - spent;
        const percentage = limit > 0 ? (spent / limit) * 100 : 0;

        return {
          id: cat.id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          spent,
          limit,
          remaining,
          percentage,
          isOverBudget: spent > limit,
        };
      });
    }),
});
