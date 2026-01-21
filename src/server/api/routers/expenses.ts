import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Decimal } from "@prisma/client/runtime/library";
import { startOfMonth, endOfMonth, subMonths, addWeeks, addMonths, addYears, addDays, format, isFuture, isValid } from "date-fns";

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

const MAX_EXPENSE_AMOUNT = 9999999.99; // ~$10M max per expense
const MIN_EXPENSE_AMOUNT = 0.01;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_NOTES_LENGTH = 2000;
const MAX_CATEGORY_NAME_LENGTH = 100;
const MAX_BUDGET_AMOUNT = 999999.99;
const MAX_FUTURE_DAYS = 365; // Allow expenses up to 1 year in future for planning

// ============================================================================
// SHARED VALIDATION SCHEMAS
// ============================================================================

const RecurrenceFrequencyEnum = z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]);

const amountSchema = z.number()
  .min(MIN_EXPENSE_AMOUNT, `Amount must be at least $${MIN_EXPENSE_AMOUNT}`)
  .max(MAX_EXPENSE_AMOUNT, `Amount cannot exceed $${MAX_EXPENSE_AMOUNT.toLocaleString()}`);

const descriptionSchema = z.string()
  .min(1, "Description is required")
  .max(MAX_DESCRIPTION_LENGTH, `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`)
  .transform(s => s.trim());

const notesSchema = z.string()
  .max(MAX_NOTES_LENGTH, `Notes cannot exceed ${MAX_NOTES_LENGTH} characters`)
  .transform(s => s.trim())
  .optional()
  .nullable();

const expenseDateSchema = z.date()
  .refine(
    (date) => isValid(date),
    { message: "Invalid date" }
  )
  .refine(
    (date) => !isFuture(addDays(date, -MAX_FUTURE_DAYS)),
    { message: `Date cannot be more than ${MAX_FUTURE_DAYS} days in the future` }
  );

const categoryNameSchema = z.string()
  .min(1, "Category name is required")
  .max(MAX_CATEGORY_NAME_LENGTH, `Category name cannot exceed ${MAX_CATEGORY_NAME_LENGTH} characters`)
  .transform(s => s.trim());

const budgetSchema = z.number()
  .min(MIN_EXPENSE_AMOUNT, `Budget must be at least $${MIN_EXPENSE_AMOUNT}`)
  .max(MAX_BUDGET_AMOUNT, `Budget cannot exceed $${MAX_BUDGET_AMOUNT.toLocaleString()}`)
  .nullable();

// Supported currencies with ISO 4217 codes
const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "CNY", "INR", "MXN", "BRL", "KRW"] as const;
const currencySchema = z.enum(SUPPORTED_CURRENCIES);

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
        amount: amountSchema,
        description: descriptionSchema,
        date: expenseDateSchema,
        paidFrom: z.enum(["SELF", "PARTNER", "JOINT"]),
        categoryId: z.string().optional(),
        notes: notesSchema,
        currency: currencySchema.optional(),
        isRecurring: z.boolean().optional(),
        frequency: RecurrenceFrequencyEnum.optional(),
      }).refine(
        (data) => !data.isRecurring || data.frequency,
        { message: "Frequency is required for recurring expenses", path: ["frequency"] }
      )
    )
    .mutation(async ({ ctx, input }) => {
      // Get user's default currency if not specified
      let currency = input.currency;
      if (!currency) {
        const config = await ctx.db.expenseSplitConfig.findUnique({
          where: { userId: ctx.session.user.id },
        });
        currency = (config?.defaultCurrency as typeof SUPPORTED_CURRENCIES[number]) ?? "USD";
      }

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
          currency,
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
        id: z.string().min(1, "Expense ID is required"),
        amount: amountSchema.optional(),
        description: descriptionSchema.optional(),
        date: expenseDateSchema.optional(),
        paidFrom: z.enum(["SELF", "PARTNER", "JOINT"]).optional(),
        categoryId: z.string().nullable().optional(),
        notes: notesSchema,
        currency: currencySchema.optional(),
        isRecurring: z.boolean().optional(),
        frequency: RecurrenceFrequencyEnum.nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, amount, isRecurring, frequency, date, currency, ...updateData } = input;

      const existing = await ctx.db.expense.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });
      }

      // Calculate next due date if recurring settings changed
      let nextDueDate: Date | null = null;
      const effectiveIsRecurring = isRecurring ?? existing.isRecurring;
      const effectiveFrequency = frequency ?? existing.frequency;
      const effectiveDate = date ?? existing.date;

      if (effectiveIsRecurring && effectiveFrequency) {
        switch (effectiveFrequency) {
          case "WEEKLY": nextDueDate = addWeeks(effectiveDate, 1); break;
          case "BIWEEKLY": nextDueDate = addWeeks(effectiveDate, 2); break;
          case "MONTHLY": nextDueDate = addMonths(effectiveDate, 1); break;
          case "QUARTERLY": nextDueDate = addMonths(effectiveDate, 3); break;
          case "YEARLY": nextDueDate = addYears(effectiveDate, 1); break;
        }
      }

      const expense = await ctx.db.expense.update({
        where: { id },
        data: {
          ...updateData,
          ...(date !== undefined && { date }),
          ...(amount !== undefined && { amount: new Decimal(amount) }),
          ...(currency !== undefined && { currency }),
          ...(isRecurring !== undefined && { isRecurring }),
          ...(frequency !== undefined && { frequency }),
          nextDueDate: effectiveIsRecurring ? nextDueDate : null,
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
        name: categoryNameSchema,
        color: z.string()
          .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color (e.g., #6366f1)")
          .optional(),
        icon: z.string().max(50).optional(),
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
    return config ?? { selfPercent: 65, partnerPercent: 35, defaultCurrency: "USD" };
  }),

  updateSplitConfig: protectedProcedure
    .input(
      z.object({
        selfPercent: z.number().min(0).max(100),
        partnerPercent: z.number().min(0).max(100),
        defaultCurrency: currencySchema.optional(),
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
          defaultCurrency: input.defaultCurrency ?? "USD",
        },
        update: {
          selfPercent: input.selfPercent,
          partnerPercent: input.partnerPercent,
          ...(input.defaultCurrency && { defaultCurrency: input.defaultCurrency }),
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

      // Handle edge case: no expenses to split
      let selfShouldPay = new Decimal(0);
      let partnerShouldPay = new Decimal(0);
      let settlementAmount = new Decimal(0);

      if (!splitTotal.isZero()) {
        // What each person should pay based on split
        selfShouldPay = splitTotal.times(selfPercent).div(100);
        partnerShouldPay = splitTotal.times(partnerPercent).div(100);

        // Settlement: positive means self owes partner, negative means partner owes self
        settlementAmount = selfShouldPay.minus(totalSelf);
      }

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

      // Handle edge case: no expenses to split
      let settlementAmount = new Decimal(0);
      if (!splitTotal.isZero()) {
        const selfShouldPay = splitTotal.times(selfPercent).div(100);
        settlementAmount = selfShouldPay.minus(totalSelf);
      }

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

  // Get settlement breakdown for a specific month (for confirmation dialog)
  getSettlementBreakdown: protectedProcedure
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
        orderBy: { date: "asc" },
      });

      // Get split config
      const splitConfig = await ctx.db.expenseSplitConfig.findUnique({
        where: { userId: ctx.session.user.id },
      });
      const selfPercent = splitConfig?.selfPercent ?? 65;
      const partnerPercent = splitConfig?.partnerPercent ?? 35;

      // Detailed breakdown by account
      const selfExpenses = expenses.filter(e => e.paidFrom === "SELF");
      const partnerExpenses = expenses.filter(e => e.paidFrom === "PARTNER");
      const jointExpenses = expenses.filter(e => e.paidFrom === "JOINT");

      const totalSelf = selfExpenses.reduce((sum, e) => sum.plus(e.amount), new Decimal(0));
      const totalPartner = partnerExpenses.reduce((sum, e) => sum.plus(e.amount), new Decimal(0));
      const totalJoint = jointExpenses.reduce((sum, e) => sum.plus(e.amount), new Decimal(0));
      const splitTotal = totalSelf.plus(totalPartner);

      // Calculate what each should pay
      let selfShouldPay = new Decimal(0);
      let settlementAmount = new Decimal(0);

      if (!splitTotal.isZero()) {
        selfShouldPay = splitTotal.times(selfPercent).div(100);
        settlementAmount = selfShouldPay.minus(totalSelf);
      }

      // Round to 2 decimal places for currency precision
      const roundedSettlement = settlementAmount.toDecimalPlaces(2);

      return {
        month: monthStart,
        breakdown: {
          selfPaid: totalSelf.toNumber(),
          selfCount: selfExpenses.length,
          partnerPaid: totalPartner.toNumber(),
          partnerCount: partnerExpenses.length,
          jointPaid: totalJoint.toNumber(),
          jointCount: jointExpenses.length,
        },
        splitConfig: { selfPercent, partnerPercent },
        calculation: {
          splitTotal: splitTotal.toNumber(),
          selfShouldPay: selfShouldPay.toDecimalPlaces(2).toNumber(),
          partnerShouldPay: splitTotal.times(partnerPercent).div(100).toDecimalPlaces(2).toNumber(),
          settlementAmount: roundedSettlement.toNumber(),
          direction: roundedSettlement.greaterThan(0) ? "self_owes_partner" : roundedSettlement.lessThan(0) ? "partner_owes_self" : "settled",
        },
        expenses: expenses.map(e => ({
          id: e.id,
          description: e.description,
          amount: e.amount.toNumber(),
          date: e.date,
          paidFrom: e.paidFrom,
          category: e.category?.name ?? null,
        })),
      };
    }),

  // Get unsettled months summary
  getUnsettledMonths: protectedProcedure.query(async ({ ctx }) => {
    // Get all months with expenses but no settlement
    const expenses = await ctx.db.expense.findMany({
      where: { userId: ctx.session.user.id },
      select: { date: true },
      orderBy: { date: "desc" },
    });

    // Get settled months
    const settlements = await ctx.db.expenseSettlement.findMany({
      where: {
        userId: ctx.session.user.id,
        settled: true,
      },
      select: { month: true },
    });

    const settledMonthsSet = new Set(
      settlements.map(s => format(s.month, "yyyy-MM"))
    );

    // Get unique months with expenses
    const monthsWithExpenses = new Set(
      expenses.map(e => format(e.date, "yyyy-MM"))
    );

    // Current month should not be marked as unsettled (month not over yet)
    const currentMonth = format(new Date(), "yyyy-MM");

    // Find unsettled months
    const unsettledMonths = Array.from(monthsWithExpenses)
      .filter(month => !settledMonthsSet.has(month) && month !== currentMonth)
      .sort((a, b) => b.localeCompare(a)); // Most recent first

    return unsettledMonths.map(monthStr => ({
      month: new Date(monthStr + "-01"),
      monthLabel: format(new Date(monthStr + "-01"), "MMMM yyyy"),
    }));
  }),

  // ============================================================================
  // RECURRING EXPENSES
  // ============================================================================

  getRecurringExpenses: protectedProcedure.query(async ({ ctx }) => {
    const expenses = await ctx.db.expense.findMany({
      where: {
        userId: ctx.session.user.id,
        isRecurring: true,
        isAutoGenerated: false, // Only get templates, not generated instances
      },
      include: { category: true },
      orderBy: { nextDueDate: "asc" },
    });

    return expenses.map(e => ({
      ...e,
      amount: e.amount.toNumber(),
    }));
  }),

  // Get upcoming recurring expenses (due in next N days)
  getUpcomingRecurring: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(30) }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const futureDate = addDays(now, input.days);

      const expenses = await ctx.db.expense.findMany({
        where: {
          userId: ctx.session.user.id,
          isRecurring: true,
          isAutoGenerated: false,
          nextDueDate: {
            gte: now,
            lte: futureDate,
          },
        },
        include: { category: true },
        orderBy: { nextDueDate: "asc" },
      });

      return expenses.map(e => ({
        ...e,
        amount: e.amount.toNumber(),
        daysUntilDue: e.nextDueDate
          ? Math.ceil((e.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      }));
    }),

  // Generate expense from recurring template
  generateFromRecurring: protectedProcedure
    .input(z.object({
      templateId: z.string(),
      date: z.date().optional(), // Use next due date if not provided
    }))
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.db.expense.findFirst({
        where: {
          id: input.templateId,
          userId: ctx.session.user.id,
          isRecurring: true,
          isAutoGenerated: false,
        },
        include: { category: true },
      });

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recurring template not found" });
      }

      const expenseDate = input.date ?? template.nextDueDate ?? new Date();

      // Create the new expense instance
      const expense = await ctx.db.expense.create({
        data: {
          amount: template.amount,
          description: template.description,
          date: expenseDate,
          paidFrom: template.paidFrom,
          notes: template.notes,
          currency: template.currency,
          categoryId: template.categoryId,
          userId: ctx.session.user.id,
          isRecurring: false,
          isAutoGenerated: true,
        },
        include: { category: true },
      });

      // Update the template's next due date
      let nextDueDate: Date | null = null;
      if (template.frequency) {
        switch (template.frequency) {
          case "WEEKLY": nextDueDate = addWeeks(expenseDate, 1); break;
          case "BIWEEKLY": nextDueDate = addWeeks(expenseDate, 2); break;
          case "MONTHLY": nextDueDate = addMonths(expenseDate, 1); break;
          case "QUARTERLY": nextDueDate = addMonths(expenseDate, 3); break;
          case "YEARLY": nextDueDate = addYears(expenseDate, 1); break;
        }
      }

      await ctx.db.expense.update({
        where: { id: template.id },
        data: { nextDueDate },
      });

      return {
        ...expense,
        amount: expense.amount.toNumber(),
      };
    }),

  // Pause/unpause recurring expense
  toggleRecurringPause: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.db.expense.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
          isRecurring: true,
        },
      });

      if (!expense) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recurring expense not found" });
      }

      // Toggle by setting/clearing nextDueDate
      const isPaused = expense.nextDueDate === null;

      let newNextDueDate: Date | null = null;
      if (isPaused && expense.frequency) {
        // Resume: calculate next due date from now
        const now = new Date();
        switch (expense.frequency) {
          case "WEEKLY": newNextDueDate = addWeeks(now, 1); break;
          case "BIWEEKLY": newNextDueDate = addWeeks(now, 2); break;
          case "MONTHLY": newNextDueDate = addMonths(now, 1); break;
          case "QUARTERLY": newNextDueDate = addMonths(now, 3); break;
          case "YEARLY": newNextDueDate = addYears(now, 1); break;
        }
      }

      const updated = await ctx.db.expense.update({
        where: { id: input.id },
        data: { nextDueDate: newNextDueDate },
        include: { category: true },
      });

      return {
        ...updated,
        amount: updated.amount.toNumber(),
        isPaused: updated.nextDueDate === null,
      };
    }),

  // Skip one occurrence of recurring expense
  skipRecurringOccurrence: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.db.expense.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
          isRecurring: true,
          nextDueDate: { not: null },
        },
      });

      if (!expense || !expense.nextDueDate || !expense.frequency) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recurring expense not found or already paused" });
      }

      // Calculate next occurrence after the one being skipped
      let nextDueDate: Date;
      switch (expense.frequency) {
        case "WEEKLY": nextDueDate = addWeeks(expense.nextDueDate, 1); break;
        case "BIWEEKLY": nextDueDate = addWeeks(expense.nextDueDate, 2); break;
        case "MONTHLY": nextDueDate = addMonths(expense.nextDueDate, 1); break;
        case "QUARTERLY": nextDueDate = addMonths(expense.nextDueDate, 3); break;
        case "YEARLY": nextDueDate = addYears(expense.nextDueDate, 1); break;
      }

      const updated = await ctx.db.expense.update({
        where: { id: input.id },
        data: { nextDueDate },
        include: { category: true },
      });

      return {
        ...updated,
        amount: updated.amount.toNumber(),
      };
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
      categoryId: z.string().min(1, "Category ID is required"),
      budget: budgetSchema,
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

  // Advanced analytics - spending insights
  getSpendingInsights: protectedProcedure
    .input(z.object({ months: z.number().min(1).max(12).default(6) }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const previousMonthStart = startOfMonth(subMonths(now, 1));
      const previousMonthEnd = endOfMonth(subMonths(now, 1));
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

      // Current month vs previous month comparison
      const currentMonthExpenses = expenses.filter(e => e.date >= currentMonthStart);
      const previousMonthExpenses = expenses.filter(
        e => e.date >= previousMonthStart && e.date <= previousMonthEnd
      );

      const currentMonthTotal = currentMonthExpenses.reduce(
        (sum, e) => sum + e.amount.toNumber(), 0
      );
      const previousMonthTotal = previousMonthExpenses.reduce(
        (sum, e) => sum + e.amount.toNumber(), 0
      );

      const monthOverMonthChange = previousMonthTotal > 0
        ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
        : 0;

      // Top spending categories this month
      const categorySpending: Record<string, { name: string; amount: number; count: number }> = {};
      for (const expense of currentMonthExpenses) {
        const catKey = expense.categoryId ?? "uncategorized";
        if (!categorySpending[catKey]) {
          categorySpending[catKey] = {
            name: expense.category?.name ?? "Uncategorized",
            amount: 0,
            count: 0,
          };
        }
        categorySpending[catKey].amount += expense.amount.toNumber();
        categorySpending[catKey].count += 1;
      }

      const topCategories = Object.values(categorySpending)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Day of week spending pattern
      const dayOfWeekSpending: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      const dayOfWeekCount: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      for (const expense of expenses) {
        const day = expense.date.getDay();
        dayOfWeekSpending[day] += expense.amount.toNumber();
        dayOfWeekCount[day] += 1;
      }

      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const spendingByDayOfWeek = dayNames.map((name, index) => ({
        day: name,
        total: dayOfWeekSpending[index],
        average: dayOfWeekCount[index] > 0 ? dayOfWeekSpending[index] / dayOfWeekCount[index] : 0,
        count: dayOfWeekCount[index],
      }));

      // Average expense amount
      const avgExpenseAmount = expenses.length > 0
        ? expenses.reduce((sum, e) => sum + e.amount.toNumber(), 0) / expenses.length
        : 0;

      // Largest single expense this month
      const largestExpense = currentMonthExpenses.length > 0
        ? currentMonthExpenses.reduce(
            (max, e) => e.amount.toNumber() > max.amount.toNumber() ? e : max,
            currentMonthExpenses[0]
          )
        : null;

      return {
        comparison: {
          currentMonth: {
            total: currentMonthTotal,
            count: currentMonthExpenses.length,
          },
          previousMonth: {
            total: previousMonthTotal,
            count: previousMonthExpenses.length,
          },
          change: monthOverMonthChange,
          trending: monthOverMonthChange > 5 ? "up" : monthOverMonthChange < -5 ? "down" : "stable",
        },
        topCategories,
        spendingByDayOfWeek,
        insights: {
          avgExpenseAmount,
          largestExpense: largestExpense ? {
            description: largestExpense.description,
            amount: largestExpense.amount.toNumber(),
            date: largestExpense.date,
            category: largestExpense.category?.name ?? "Uncategorized",
          } : null,
          expenseCount: expenses.length,
          uniqueCategories: Object.keys(categorySpending).length,
        },
      };
    }),

  // Quick add - simplified expense creation
  quickAdd: protectedProcedure
    .input(z.object({
      amount: amountSchema,
      description: descriptionSchema,
      paidFrom: z.enum(["SELF", "PARTNER", "JOINT"]).default("SELF"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get user's default currency
      const config = await ctx.db.expenseSplitConfig.findUnique({
        where: { userId: ctx.session.user.id },
      });
      const currency = config?.defaultCurrency ?? "USD";

      const expense = await ctx.db.expense.create({
        data: {
          amount: new Decimal(input.amount),
          description: input.description,
          date: new Date(),
          paidFrom: input.paidFrom,
          currency,
          userId: ctx.session.user.id,
        },
        include: { category: true },
      });

      return {
        ...expense,
        amount: expense.amount.toNumber(),
      };
    }),

  // Get expense statistics summary for dashboard widget
  getDashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    // Current month expenses
    const expenses = await ctx.db.expense.findMany({
      where: {
        userId: ctx.session.user.id,
        date: { gte: currentMonthStart, lte: currentMonthEnd },
      },
    });

    // Count unsettled months
    const settlements = await ctx.db.expenseSettlement.findMany({
      where: {
        userId: ctx.session.user.id,
        settled: true,
      },
      select: { month: true },
    });
    const settledMonthsSet = new Set(settlements.map(s => format(s.month, "yyyy-MM")));

    const allExpenses = await ctx.db.expense.findMany({
      where: { userId: ctx.session.user.id },
      select: { date: true },
    });
    const monthsWithExpenses = new Set(allExpenses.map(e => format(e.date, "yyyy-MM")));
    const currentMonth = format(now, "yyyy-MM");
    const unsettledCount = Array.from(monthsWithExpenses).filter(
      m => !settledMonthsSet.has(m) && m !== currentMonth
    ).length;

    // Due recurring expenses count
    const dueRecurring = await ctx.db.expense.count({
      where: {
        userId: ctx.session.user.id,
        isRecurring: true,
        isAutoGenerated: false,
        nextDueDate: { lte: addDays(now, 7) },
      },
    });

    const totalThisMonth = expenses.reduce((sum, e) => sum + e.amount.toNumber(), 0);
    const expenseCount = expenses.length;

    return {
      totalThisMonth,
      expenseCount,
      unsettledMonths: unsettledCount,
      dueRecurring,
      currentMonth: format(now, "MMMM yyyy"),
    };
  }),

  exportToCSV: protectedProcedure
    .input(z.object({
      startDate: z.date().refine(d => isValid(d), "Invalid start date"),
      endDate: z.date().refine(d => isValid(d), "Invalid end date"),
    }).refine(
      (data) => data.startDate <= data.endDate,
      { message: "Start date must be before or equal to end date", path: ["startDate"] }
    ).refine(
      (data) => {
        const daysDiff = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 730; // Max 2 years export range
      },
      { message: "Export range cannot exceed 2 years", path: ["endDate"] }
    ))
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
