import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Decimal } from "@prisma/client/runtime/library";
import { startOfMonth, endOfMonth, subMonths, addWeeks, addMonths, addYears, format } from "date-fns";

const RecurrenceFrequencyEnum = z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]);

export const expensesRouter = createTRPCRouter({
  // ============================================================================
  // EXPENSE CRUD
  // ============================================================================

  getAll: protectedProcedure
    .input(
      z.object({
        month: z.date().optional(), // Filter by month
        categoryId: z.string().optional(),
        paidFrom: z.enum(["SELF", "PARTNER", "JOINT"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const monthStart = input?.month ? startOfMonth(input.month) : undefined;
      const monthEnd = input?.month ? endOfMonth(input.month) : undefined;

      const expenses = await ctx.db.expense.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(monthStart && monthEnd && {
            date: { gte: monthStart, lte: monthEnd },
          }),
          ...(input?.categoryId && { categoryId: input.categoryId }),
          ...(input?.paidFrom && { paidFrom: input.paidFrom }),
          ...(input?.search && {
            description: { contains: input.search, mode: "insensitive" },
          }),
        },
        include: {
          category: true,
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: input?.limit ?? 50,
        ...(input?.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      return {
        expenses: expenses.map(e => ({
          ...e,
          amount: e.amount.toNumber(),
        })),
        nextCursor: expenses.length === (input?.limit ?? 50) ? expenses[expenses.length - 1]?.id : undefined,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const expense = await ctx.db.expense.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { category: true },
      });

      if (!expense) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });
      }

      return {
        ...expense,
        amount: expense.amount.toNumber(),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        description: z.string().min(1).max(500),
        date: z.date(),
        paidFrom: z.enum(["SELF", "PARTNER", "JOINT"]),
        categoryId: z.string().optional(),
        notes: z.string().optional(),
        isRecurring: z.boolean().optional(),
        frequency: RecurrenceFrequencyEnum.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Calculate next due date for recurring expenses
      let nextDueDate: Date | null = null;
      if (input.isRecurring && input.frequency) {
        const baseDate = input.date;
        switch (input.frequency) {
          case "WEEKLY": nextDueDate = addWeeks(baseDate, 1); break;
          case "BIWEEKLY": nextDueDate = addWeeks(baseDate, 2); break;
          case "MONTHLY": nextDueDate = addMonths(baseDate, 1); break;
          case "QUARTERLY": nextDueDate = addMonths(baseDate, 3); break;
          case "YEARLY": nextDueDate = addYears(baseDate, 1); break;
        }
      }

      const expense = await ctx.db.expense.create({
        data: {
          amount: new Decimal(input.amount),
          description: input.description,
          date: input.date,
          paidFrom: input.paidFrom,
          categoryId: input.categoryId,
          notes: input.notes,
          isRecurring: input.isRecurring ?? false,
          frequency: input.frequency,
          nextDueDate,
          userId: ctx.session.user.id,
        },
        include: { category: true },
      });

      return {
        ...expense,
        amount: expense.amount.toNumber(),
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.number().positive().optional(),
        description: z.string().min(1).max(500).optional(),
        date: z.date().optional(),
        paidFrom: z.enum(["SELF", "PARTNER", "JOINT"]).optional(),
        categoryId: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, amount, ...updateData } = input;

      const existing = await ctx.db.expense.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });
      }

      const expense = await ctx.db.expense.update({
        where: { id },
        data: {
          ...updateData,
          ...(amount !== undefined && { amount: new Decimal(amount) }),
        },
        include: { category: true },
      });

      return {
        ...expense,
        amount: expense.amount.toNumber(),
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.expense.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });
      }

      await ctx.db.expense.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  getCategories: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.expenseCategory.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { name: "asc" },
    });
  }),

  createCategory: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        color: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate
      const existing = await ctx.db.expenseCategory.findUnique({
        where: {
          userId_name: {
            userId: ctx.session.user.id,
            name: input.name,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Category with this name already exists",
        });
      }

      return ctx.db.expenseCategory.create({
        data: {
          name: input.name,
          color: input.color ?? "#6366f1",
          icon: input.icon,
          userId: ctx.session.user.id,
        },
      });
    }),

  deleteCategory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.expenseCategory.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }

      await ctx.db.expenseCategory.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // ============================================================================
  // SPLIT CONFIGURATION
  // ============================================================================

  getSplitConfig: protectedProcedure.query(async ({ ctx }) => {
    const config = await ctx.db.expenseSplitConfig.findUnique({
      where: { userId: ctx.session.user.id },
    });

    // Return default if not set
    return config ?? { selfPercent: 65, partnerPercent: 35 };
  }),

  updateSplitConfig: protectedProcedure
    .input(
      z.object({
        selfPercent: z.number().min(0).max(100),
        partnerPercent: z.number().min(0).max(100),
      }).refine((data) => data.selfPercent + data.partnerPercent === 100, {
        message: "Split percentages must add up to 100",
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.expenseSplitConfig.upsert({
        where: { userId: ctx.session.user.id },
        create: {
          userId: ctx.session.user.id,
          selfPercent: input.selfPercent,
          partnerPercent: input.partnerPercent,
        },
        update: {
          selfPercent: input.selfPercent,
          partnerPercent: input.partnerPercent,
        },
      });
    }),

  // ============================================================================
  // MONTHLY SUMMARY & SETTLEMENT
  // ============================================================================

  getMonthlySummary: protectedProcedure
    .input(z.object({ month: z.date() }))
    .query(async ({ ctx, input }) => {
      const monthStart = startOfMonth(input.month);
      const monthEnd = endOfMonth(input.month);

      // Get all expenses for the month
      const expenses = await ctx.db.expense.findMany({
        where: {
          userId: ctx.session.user.id,
          date: { gte: monthStart, lte: monthEnd },
        },
        include: { category: true },
      });

      // Get split config
      const splitConfig = await ctx.db.expenseSplitConfig.findUnique({
        where: { userId: ctx.session.user.id },
      });
      const selfPercent = splitConfig?.selfPercent ?? 65;
      const partnerPercent = splitConfig?.partnerPercent ?? 35;

      // Calculate totals by payment account
      let totalSelf = new Decimal(0);
      let totalPartner = new Decimal(0);
      let totalJoint = new Decimal(0);
      let grandTotal = new Decimal(0);

      // Category breakdown
      const categoryTotals: Record<string, { name: string; color: string; amount: Decimal }> = {};

      for (const expense of expenses) {
        grandTotal = grandTotal.plus(expense.amount);

        if (expense.paidFrom === "SELF") {
          totalSelf = totalSelf.plus(expense.amount);
        } else if (expense.paidFrom === "PARTNER") {
          totalPartner = totalPartner.plus(expense.amount);
        } else {
          totalJoint = totalJoint.plus(expense.amount);
        }

        // Category tracking
        const catKey = expense.categoryId ?? "uncategorized";
        if (!categoryTotals[catKey]) {
          categoryTotals[catKey] = {
            name: expense.category?.name ?? "Uncategorized",
            color: expense.category?.color ?? "#9ca3af",
            amount: new Decimal(0),
          };
        }
        categoryTotals[catKey].amount = categoryTotals[catKey].amount.plus(expense.amount);
      }

      // Calculate settlement
      // Total joint expenses (excluding joint account as it's assumed equally funded)
      const splitTotal = totalSelf.plus(totalPartner);

      // What each person should pay based on split
      const selfShouldPay = splitTotal.times(selfPercent).div(100);
      const partnerShouldPay = splitTotal.times(partnerPercent).div(100);

      // Settlement: positive means self owes partner, negative means partner owes self
      const settlementAmount = selfShouldPay.minus(totalSelf);

      // Get existing settlement record
      const settlement = await ctx.db.expenseSettlement.findUnique({
        where: {
          userId_month: {
            userId: ctx.session.user.id,
            month: monthStart,
          },
        },
      });

      return {
        month: monthStart,
        expenses: expenses.map(e => ({
          ...e,
          amount: e.amount.toNumber(),
        })),
        totals: {
          self: totalSelf.toNumber(),
          partner: totalPartner.toNumber(),
          joint: totalJoint.toNumber(),
          grand: grandTotal.toNumber(),
        },
        splitConfig: { selfPercent, partnerPercent },
        calculation: {
          splitTotal: splitTotal.toNumber(),
          selfShouldPay: selfShouldPay.toNumber(),
          partnerShouldPay: partnerShouldPay.toNumber(),
          settlementAmount: settlementAmount.toNumber(),
        },
        categories: Object.values(categoryTotals).map(c => ({
          name: c.name,
          color: c.color,
          amount: c.amount.toNumber(),
        })),
        settlement: settlement ? {
          ...settlement,
          amount: settlement.amount.toNumber(),
        } : null,
      };
    }),

  // ============================================================================
  // SETTLEMENTS
  // ============================================================================

  getSettlements: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(24).default(12),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const settlements = await ctx.db.expenseSettlement.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { month: "desc" },
        take: input?.limit ?? 12,
      });

      return settlements.map(s => ({
        ...s,
        amount: s.amount.toNumber(),
      }));
    }),

  markSettled: protectedProcedure
    .input(
      z.object({
        month: z.date(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const monthStart = startOfMonth(input.month);

      // Calculate the settlement amount
      const summary = await ctx.db.expense.findMany({
        where: {
          userId: ctx.session.user.id,
          date: { gte: monthStart, lte: endOfMonth(input.month) },
        },
      });

      const splitConfig = await ctx.db.expenseSplitConfig.findUnique({
        where: { userId: ctx.session.user.id },
      });
      const selfPercent = splitConfig?.selfPercent ?? 65;

      let totalSelf = new Decimal(0);
      let totalPartner = new Decimal(0);

      for (const expense of summary) {
        if (expense.paidFrom === "SELF") {
          totalSelf = totalSelf.plus(expense.amount);
        } else if (expense.paidFrom === "PARTNER") {
          totalPartner = totalPartner.plus(expense.amount);
        }
      }

      const splitTotal = totalSelf.plus(totalPartner);
      const selfShouldPay = splitTotal.times(selfPercent).div(100);
      const settlementAmount = selfShouldPay.minus(totalSelf);

      return ctx.db.expenseSettlement.upsert({
        where: {
          userId_month: {
            userId: ctx.session.user.id,
            month: monthStart,
          },
        },
        create: {
          userId: ctx.session.user.id,
          month: monthStart,
          amount: settlementAmount,
          settled: true,
          settledAt: new Date(),
          notes: input.notes,
        },
        update: {
          amount: settlementAmount,
          settled: true,
          settledAt: new Date(),
          notes: input.notes,
        },
      });
    }),

  unmarkSettled: protectedProcedure
    .input(z.object({ month: z.date() }))
    .mutation(async ({ ctx, input }) => {
      const monthStart = startOfMonth(input.month);

      const settlement = await ctx.db.expenseSettlement.findUnique({
        where: {
          userId_month: {
            userId: ctx.session.user.id,
            month: monthStart,
          },
        },
      });

      if (!settlement) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Settlement not found" });
      }

      return ctx.db.expenseSettlement.update({
        where: { id: settlement.id },
        data: {
          settled: false,
          settledAt: null,
        },
      });
    }),

  // ============================================================================
  // RECURRING EXPENSES
  // ============================================================================

  getRecurringExpenses: protectedProcedure.query(async ({ ctx }) => {
    const expenses = await ctx.db.expense.findMany({
      where: {
        userId: ctx.session.user.id,
        isRecurring: true,
      },
      include: { category: true },
      orderBy: { nextDueDate: "asc" },
    });

    return expenses.map(e => ({
      ...e,
      amount: e.amount.toNumber(),
    }));
  }),

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  getAnalytics: protectedProcedure
    .input(z.object({ months: z.number().min(1).max(12).default(6) }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const startDate = startOfMonth(subMonths(now, input.months - 1));

      // Get all expenses in the date range
      const expenses = await ctx.db.expense.findMany({
        where: {
          userId: ctx.session.user.id,
          date: { gte: startDate },
        },
        include: { category: true },
        orderBy: { date: "asc" },
      });

      // Get categories with budgets
      const categories = await ctx.db.expenseCategory.findMany({
        where: { userId: ctx.session.user.id },
      });

      // Calculate monthly totals
      const monthlyData: Record<string, {
        month: string;
        self: number;
        partner: number;
        joint: number;
        total: number;
      }> = {};

      // Category totals for current month
      const currentMonthStart = startOfMonth(now);
      const categorySpending: Record<string, { name: string; color: string; spent: number; budget: number | null }> = {};

      for (const expense of expenses) {
        const monthKey = format(expense.date, "yyyy-MM");

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: format(expense.date, "MMM yyyy"),
            self: 0,
            partner: 0,
            joint: 0,
            total: 0,
          };
        }

        const amount = expense.amount.toNumber();
        monthlyData[monthKey].total += amount;

        if (expense.paidFrom === "SELF") monthlyData[monthKey].self += amount;
        else if (expense.paidFrom === "PARTNER") monthlyData[monthKey].partner += amount;
        else monthlyData[monthKey].joint += amount;

        // Track current month category spending
        if (expense.date >= currentMonthStart) {
          const catId = expense.categoryId ?? "uncategorized";
          if (!categorySpending[catId]) {
            const cat = categories.find(c => c.id === catId);
            categorySpending[catId] = {
              name: expense.category?.name ?? "Uncategorized",
              color: expense.category?.color ?? "#9ca3af",
              spent: 0,
              budget: cat?.budget?.toNumber() ?? null,
            };
          }
          categorySpending[catId].spent += amount;
        }
      }

      // Sort months chronologically
      const monthlyTrend = Object.values(monthlyData).sort((a, b) =>
        new Date(a.month).getTime() - new Date(b.month).getTime()
      );

      // Calculate totals and averages
      const totalSpent = expenses.reduce((sum, e) => sum + e.amount.toNumber(), 0);
      const avgMonthly = totalSpent / input.months;

      return {
        monthlyTrend,
        categorySpending: Object.values(categorySpending).sort((a, b) => b.spent - a.spent),
        summary: {
          totalSpent,
          avgMonthly,
          expenseCount: expenses.length,
          months: input.months,
        },
      };
    }),

  // ============================================================================
  // BUDGET MANAGEMENT
  // ============================================================================

  updateCategoryBudget: protectedProcedure
    .input(z.object({
      categoryId: z.string(),
      budget: z.number().positive().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.expenseCategory.findFirst({
        where: { id: input.categoryId, userId: ctx.session.user.id },
      });

      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }

      return ctx.db.expenseCategory.update({
        where: { id: input.categoryId },
        data: {
          budget: input.budget ? new Decimal(input.budget) : null,
        },
      });
    }),

  getCategoriesWithBudgets: protectedProcedure
    .input(z.object({ month: z.date() }))
    .query(async ({ ctx, input }) => {
      const monthStart = startOfMonth(input.month);
      const monthEnd = endOfMonth(input.month);

      const categories = await ctx.db.expenseCategory.findMany({
        where: { userId: ctx.session.user.id },
        include: {
          expenses: {
            where: {
              date: { gte: monthStart, lte: monthEnd },
            },
          },
        },
      });

      return categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        budget: cat.budget?.toNumber() ?? null,
        spent: cat.expenses.reduce((sum, e) => sum + e.amount.toNumber(), 0),
      }));
    }),

  // ============================================================================
  // EXPORT
  // ============================================================================

  exportToCSV: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const expenses = await ctx.db.expense.findMany({
        where: {
          userId: ctx.session.user.id,
          date: { gte: input.startDate, lte: input.endDate },
        },
        include: { category: true },
        orderBy: { date: "asc" },
      });

      // Generate CSV content
      const headers = ["Date", "Description", "Amount", "Category", "Paid From", "Notes", "Recurring"];
      const rows = expenses.map(e => [
        format(e.date, "yyyy-MM-dd"),
        `"${e.description.replace(/"/g, '""')}"`,
        e.amount.toNumber().toFixed(2),
        e.category?.name ?? "",
        e.paidFrom,
        e.notes ? `"${e.notes.replace(/"/g, '""')}"` : "",
        e.isRecurring ? "Yes" : "No",
      ]);

      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

      return {
        csv,
        filename: `expenses_${format(input.startDate, "yyyy-MM-dd")}_to_${format(input.endDate, "yyyy-MM-dd")}.csv`,
        count: expenses.length,
      };
    }),
});
