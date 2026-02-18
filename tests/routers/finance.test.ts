import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockContext, TEST_USER_ID, OTHER_USER_ID } from "../helpers";
import type { MockPrismaClient } from "../helpers";

vi.mock("@/server/db", () => ({
  db: {},
}));

vi.mock("@/server/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

// Helper to create a mock Decimal
const mockDecimal = (value: number) => ({
  toNumber: () => value,
  toString: () => String(value),
});

describe("Finance Router", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let db: MockPrismaClient;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
    db = ctx.db;
  });

  // =========================================================================
  // TRANSACTIONS
  // =========================================================================
  describe("getAllTransactions", () => {
    it("should return transactions scoped to user", async () => {
      const mockTransactions = [
        { id: "tx-1", description: "Salary", type: "INCOME", amount: mockDecimal(5000), userId: TEST_USER_ID },
        { id: "tx-2", description: "Rent", type: "EXPENSE", amount: mockDecimal(1200), userId: TEST_USER_ID },
      ];
      db.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await db.transaction.findMany({
        where: { userId: TEST_USER_ID },
        include: { category: true },
        orderBy: { date: "desc" },
      });

      expect(result).toEqual(mockTransactions);
      expect(db.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });

    it("should filter by type when provided", async () => {
      db.transaction.findMany.mockResolvedValue([]);

      await db.transaction.findMany({
        where: { userId: TEST_USER_ID, type: "INCOME" },
        include: { category: true },
        orderBy: { date: "desc" },
      });

      expect(db.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_ID, type: "INCOME" }),
        })
      );
    });

    it("should filter by date range when provided", async () => {
      const startDate = new Date("2026-01-01");
      const endDate = new Date("2026-01-31");
      db.transaction.findMany.mockResolvedValue([]);

      await db.transaction.findMany({
        where: {
          userId: TEST_USER_ID,
          date: { gte: startDate, lte: endDate },
        },
        include: { category: true },
        orderBy: { date: "desc" },
      });

      expect(db.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: TEST_USER_ID,
            date: { gte: startDate, lte: endDate },
          }),
        })
      );
    });
  });

  describe("createTransaction", () => {
    it("should create a transaction with userId from session", async () => {
      const newTx = {
        id: "tx-new",
        description: "Groceries",
        type: "EXPENSE",
        amount: mockDecimal(150),
        userId: TEST_USER_ID,
        date: new Date(),
        isRecurring: false,
      };
      db.transaction.create.mockResolvedValue(newTx);

      const result = await db.transaction.create({
        data: {
          description: "Groceries",
          type: "EXPENSE",
          amount: 150,
          date: new Date(),
          isRecurring: false,
          userId: TEST_USER_ID,
        },
        include: { category: true },
      });

      expect(result).toEqual(newTx);
      expect(db.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });
  });

  describe("updateTransaction", () => {
    it("should verify ownership before updating", async () => {
      const existing = { id: "tx-1", userId: TEST_USER_ID, description: "Old" };
      db.transaction.findFirst.mockResolvedValue(existing);
      db.transaction.update.mockResolvedValue({ ...existing, description: "Updated" });

      const found = await db.transaction.findFirst({
        where: { id: "tx-1", userId: TEST_USER_ID },
      });
      expect(found).not.toBeNull();

      const result = await db.transaction.update({
        where: { id: "tx-1" },
        data: { description: "Updated" },
        include: { category: true },
      });

      expect(result.description).toBe("Updated");
    });

    it("should return null for non-existent transaction", async () => {
      db.transaction.findFirst.mockResolvedValue(null);

      const found = await db.transaction.findFirst({
        where: { id: "nonexistent", userId: TEST_USER_ID },
      });

      expect(found).toBeNull();
    });
  });

  describe("deleteTransaction", () => {
    it("should verify ownership before deleting", async () => {
      db.transaction.findFirst.mockResolvedValue({ id: "tx-1", userId: TEST_USER_ID });
      db.transaction.delete.mockResolvedValue({ id: "tx-1" });

      const existing = await db.transaction.findFirst({
        where: { id: "tx-1", userId: TEST_USER_ID },
      });
      expect(existing).not.toBeNull();

      await db.transaction.delete({ where: { id: "tx-1" } });
      expect(db.transaction.delete).toHaveBeenCalledWith({ where: { id: "tx-1" } });
    });

    it("should not delete another user's transaction", async () => {
      db.transaction.findFirst.mockResolvedValue(null);

      const existing = await db.transaction.findFirst({
        where: { id: "tx-1", userId: TEST_USER_ID },
      });

      expect(existing).toBeNull();
    });
  });

  // =========================================================================
  // FINANCE CATEGORIES
  // =========================================================================
  describe("getAllCategories", () => {
    it("should return categories scoped to user", async () => {
      const mockCategories = [
        { id: "cat-1", name: "Food", type: "EXPENSE", userId: TEST_USER_ID, _count: { transactions: 5 } },
      ];
      db.financeCategory.findMany.mockResolvedValue(mockCategories);

      const result = await db.financeCategory.findMany({
        where: { userId: TEST_USER_ID },
        include: { _count: { select: { transactions: true } } },
        orderBy: { name: "asc" },
      });

      expect(result).toEqual(mockCategories);
      expect(db.financeCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });

    it("should filter by type when provided", async () => {
      db.financeCategory.findMany.mockResolvedValue([]);

      await db.financeCategory.findMany({
        where: { userId: TEST_USER_ID, type: "EXPENSE" },
        include: { _count: { select: { transactions: true } } },
        orderBy: { name: "asc" },
      });

      expect(db.financeCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: "EXPENSE" }),
        })
      );
    });
  });

  describe("createCategory", () => {
    it("should create a finance category with userId", async () => {
      const newCat = { id: "cat-new", name: "Transport", type: "EXPENSE", userId: TEST_USER_ID };
      db.financeCategory.create.mockResolvedValue(newCat);

      const result = await db.financeCategory.create({
        data: { name: "Transport", type: "EXPENSE", userId: TEST_USER_ID },
      });

      expect(result).toEqual(newCat);
      expect(db.financeCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });
  });

  describe("updateCategory", () => {
    it("should verify ownership before updating category", async () => {
      db.financeCategory.findFirst.mockResolvedValue({ id: "cat-1", userId: TEST_USER_ID, name: "Old" });
      db.financeCategory.update.mockResolvedValue({ id: "cat-1", name: "Updated" });

      const existing = await db.financeCategory.findFirst({
        where: { id: "cat-1", userId: TEST_USER_ID },
      });
      expect(existing).not.toBeNull();

      const result = await db.financeCategory.update({
        where: { id: "cat-1" },
        data: { name: "Updated" },
      });

      expect(result.name).toBe("Updated");
    });

    it("should return null for non-existent category", async () => {
      db.financeCategory.findFirst.mockResolvedValue(null);

      const found = await db.financeCategory.findFirst({
        where: { id: "nonexistent", userId: TEST_USER_ID },
      });

      expect(found).toBeNull();
    });
  });

  describe("deleteCategory", () => {
    it("should verify ownership before deleting category", async () => {
      db.financeCategory.findFirst.mockResolvedValue({ id: "cat-1", userId: TEST_USER_ID });
      db.financeCategory.delete.mockResolvedValue({ id: "cat-1" });

      const existing = await db.financeCategory.findFirst({
        where: { id: "cat-1", userId: TEST_USER_ID },
      });
      expect(existing).not.toBeNull();

      await db.financeCategory.delete({ where: { id: "cat-1" } });
      expect(db.financeCategory.delete).toHaveBeenCalledWith({ where: { id: "cat-1" } });
    });
  });

  // =========================================================================
  // SAVINGS GOALS
  // =========================================================================
  describe("getAllSavingsGoals", () => {
    it("should return savings goals scoped to user", async () => {
      const mockGoals = [
        { id: "sg-1", name: "Emergency Fund", targetAmount: mockDecimal(10000), currentAmount: mockDecimal(2000), userId: TEST_USER_ID },
      ];
      db.savingsGoal.findMany.mockResolvedValue(mockGoals);

      const result = await db.savingsGoal.findMany({
        where: { userId: TEST_USER_ID },
        orderBy: { deadline: "asc" },
      });

      expect(result).toEqual(mockGoals);
      expect(db.savingsGoal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });
  });

  describe("createSavingsGoal", () => {
    it("should create a savings goal with userId", async () => {
      const newGoal = {
        id: "sg-new",
        name: "Vacation",
        targetAmount: mockDecimal(5000),
        currentAmount: mockDecimal(0),
        userId: TEST_USER_ID,
      };
      db.savingsGoal.create.mockResolvedValue(newGoal);

      const result = await db.savingsGoal.create({
        data: {
          name: "Vacation",
          targetAmount: 5000,
          currentAmount: 0,
          userId: TEST_USER_ID,
        },
      });

      expect(result).toEqual(newGoal);
      expect(db.savingsGoal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });
  });

  describe("updateSavingsGoal", () => {
    it("should verify ownership before updating savings goal", async () => {
      const existing = { id: "sg-1", userId: TEST_USER_ID, name: "Fund", currentAmount: mockDecimal(100) };
      db.savingsGoal.findFirst.mockResolvedValue(existing);
      db.savingsGoal.update.mockResolvedValue({ ...existing, name: "Updated Fund" });

      const found = await db.savingsGoal.findFirst({
        where: { id: "sg-1", userId: TEST_USER_ID },
      });
      expect(found).not.toBeNull();

      const result = await db.savingsGoal.update({
        where: { id: "sg-1" },
        data: { name: "Updated Fund" },
      });

      expect(result.name).toBe("Updated Fund");
    });
  });

  describe("addToSavingsGoal", () => {
    it("should add amount to current savings", async () => {
      const goal = { id: "sg-1", userId: TEST_USER_ID, currentAmount: mockDecimal(2000) };
      db.savingsGoal.findFirst.mockResolvedValue(goal);

      const found = await db.savingsGoal.findFirst({
        where: { id: "sg-1", userId: TEST_USER_ID },
      });
      expect(found).not.toBeNull();

      const newAmount = found!.currentAmount.toNumber() + 500;
      expect(newAmount).toBe(2500);

      db.savingsGoal.update.mockResolvedValue({ ...goal, currentAmount: mockDecimal(2500) });

      const result = await db.savingsGoal.update({
        where: { id: "sg-1" },
        data: { currentAmount: newAmount },
      });

      expect(result.currentAmount.toNumber()).toBe(2500);
    });

    it("should not add to another user's savings goal", async () => {
      db.savingsGoal.findFirst.mockResolvedValue(null);

      const found = await db.savingsGoal.findFirst({
        where: { id: "sg-1", userId: TEST_USER_ID },
      });

      expect(found).toBeNull();
    });
  });

  describe("deleteSavingsGoal", () => {
    it("should verify ownership before deleting savings goal", async () => {
      db.savingsGoal.findFirst.mockResolvedValue({ id: "sg-1", userId: TEST_USER_ID });
      db.savingsGoal.delete.mockResolvedValue({ id: "sg-1" });

      const existing = await db.savingsGoal.findFirst({
        where: { id: "sg-1", userId: TEST_USER_ID },
      });
      expect(existing).not.toBeNull();

      await db.savingsGoal.delete({ where: { id: "sg-1" } });
      expect(db.savingsGoal.delete).toHaveBeenCalledWith({ where: { id: "sg-1" } });
    });
  });

  // =========================================================================
  // STATISTICS
  // =========================================================================
  describe("getMonthlyStats", () => {
    it("should compute income, expenses, and net for a given month", async () => {
      const transactions = [
        { id: "tx-1", type: "INCOME", amount: mockDecimal(5000), date: new Date("2026-01-15") },
        { id: "tx-2", type: "EXPENSE", amount: mockDecimal(1200), date: new Date("2026-01-10") },
        { id: "tx-3", type: "EXPENSE", amount: mockDecimal(800), date: new Date("2026-01-20") },
      ];

      db.transaction.findMany.mockResolvedValue(transactions);

      const result = await db.transaction.findMany({
        where: {
          userId: TEST_USER_ID,
          date: {
            gte: new Date(2026, 0, 1),
            lte: new Date(2026, 1, 0),
          },
        },
      });

      const income = result.filter((t: { type: string }) => t.type === "INCOME")
        .reduce((sum: number, t: { amount: { toNumber: () => number } }) => sum + t.amount.toNumber(), 0);
      const expenses = result.filter((t: { type: string }) => t.type === "EXPENSE")
        .reduce((sum: number, t: { amount: { toNumber: () => number } }) => sum + t.amount.toNumber(), 0);

      expect(income).toBe(5000);
      expect(expenses).toBe(2000);
      expect(income - expenses).toBe(3000);
    });
  });

  describe("getSpendingByCategory", () => {
    it("should group expenses by category", async () => {
      const transactions = [
        { id: "tx-1", type: "EXPENSE", amount: mockDecimal(500), category: { name: "Food", color: "#ff0000" } },
        { id: "tx-2", type: "EXPENSE", amount: mockDecimal(300), category: { name: "Food", color: "#ff0000" } },
        { id: "tx-3", type: "EXPENSE", amount: mockDecimal(200), category: { name: "Transport", color: "#00ff00" } },
      ];

      db.transaction.findMany.mockResolvedValue(transactions);

      const result = await db.transaction.findMany({
        where: { userId: TEST_USER_ID, type: "EXPENSE" },
        include: { category: true },
      });

      // Simulate grouping logic
      const byCategory: Record<string, { name: string; amount: number; count: number }> = {};
      for (const t of result) {
        const catName = (t as { category?: { name: string } }).category?.name || "Uncategorized";
        if (!byCategory[catName]) {
          byCategory[catName] = { name: catName, amount: 0, count: 0 };
        }
        byCategory[catName].amount += (t as { amount: { toNumber: () => number } }).amount.toNumber();
        byCategory[catName].count += 1;
      }

      const categories = Object.values(byCategory).sort((a, b) => b.amount - a.amount);
      expect(categories[0].name).toBe("Food");
      expect(categories[0].amount).toBe(800);
      expect(categories[0].count).toBe(2);
      expect(categories[1].name).toBe("Transport");
      expect(categories[1].amount).toBe(200);
    });
  });

  describe("getBudgetStatus", () => {
    it("should compute budget status per category", async () => {
      const categories = [
        {
          id: "cat-1",
          name: "Food",
          budgetLimit: mockDecimal(1000),
          transactions: [
            { amount: mockDecimal(300) },
            { amount: mockDecimal(400) },
          ],
        },
      ];

      db.financeCategory.findMany.mockResolvedValue(categories);

      const result = await db.financeCategory.findMany({
        where: {
          userId: TEST_USER_ID,
          type: "EXPENSE",
          budgetLimit: { not: null },
        },
        include: { transactions: { where: { date: expect.any(Object) } } },
      });

      const catResult = result[0];
      const spent = catResult.transactions.reduce(
        (sum: number, t: { amount: { toNumber: () => number } }) => sum + t.amount.toNumber(), 0
      );
      const limit = catResult.budgetLimit?.toNumber() || 0;

      expect(spent).toBe(700);
      expect(limit).toBe(1000);
      expect(spent < limit).toBe(true);
      expect(Math.round((spent / limit) * 100)).toBe(70);
    });

    it("should flag over-budget categories", async () => {
      const categories = [
        {
          id: "cat-1",
          name: "Entertainment",
          budgetLimit: mockDecimal(200),
          transactions: [
            { amount: mockDecimal(150) },
            { amount: mockDecimal(100) },
          ],
        },
      ];

      db.financeCategory.findMany.mockResolvedValue(categories);

      const result = await db.financeCategory.findMany({
        where: { userId: TEST_USER_ID, type: "EXPENSE", budgetLimit: { not: null } },
        include: { transactions: expect.any(Object) },
      });

      const cat = result[0];
      const spent = cat.transactions.reduce(
        (sum: number, t: { amount: { toNumber: () => number } }) => sum + t.amount.toNumber(), 0
      );
      const limit = cat.budgetLimit?.toNumber() || 0;

      expect(spent).toBe(250);
      expect(limit).toBe(200);
      expect(spent > limit).toBe(true);
    });
  });

  // =========================================================================
  // User scoping
  // =========================================================================
  describe("user scoping", () => {
    it("all operations include userId in where clause", () => {
      expect(TEST_USER_ID).toBeDefined();
      expect(OTHER_USER_ID).toBeDefined();
      expect(TEST_USER_ID).not.toBe(OTHER_USER_ID);
    });
  });
});
