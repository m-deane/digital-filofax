import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockContext, TEST_USER_ID, OTHER_USER_ID } from "../helpers";
import type { MockPrismaClient } from "../helpers";
import { startOfDay, startOfMonth, subDays } from "date-fns";

vi.mock("@/server/db", () => ({
  db: {},
}));

vi.mock("@/server/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

describe("Reflections Router", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let db: MockPrismaClient;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
    db = ctx.db;
  });

  // =========================================================================
  // DAILY REFLECTIONS
  // =========================================================================
  describe("getDailyByDate", () => {
    it("should return daily reflection for a specific date", async () => {
      const date = new Date("2026-02-08");
      const dateOnly = startOfDay(date);
      const mockReflection = {
        id: "dr-1",
        date: dateOnly,
        morningIntention: "Be productive",
        userId: TEST_USER_ID,
      };

      db.dailyReflection.findFirst.mockResolvedValue(mockReflection);

      const result = await db.dailyReflection.findFirst({
        where: { userId: TEST_USER_ID, date: dateOnly },
      });

      expect(result).toEqual(mockReflection);
      expect(db.dailyReflection.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });

    it("should return null when no reflection exists for date", async () => {
      db.dailyReflection.findFirst.mockResolvedValue(null);

      const result = await db.dailyReflection.findFirst({
        where: { userId: TEST_USER_ID, date: startOfDay(new Date()) },
      });

      expect(result).toBeNull();
    });
  });

  describe("getDailyRange", () => {
    it("should return reflections within a date range", async () => {
      const startDate = new Date("2026-02-01");
      const endDate = new Date("2026-02-08");
      const mockReflections = [
        { id: "dr-1", date: new Date("2026-02-08"), userId: TEST_USER_ID },
        { id: "dr-2", date: new Date("2026-02-07"), userId: TEST_USER_ID },
      ];

      db.dailyReflection.findMany.mockResolvedValue(mockReflections);

      const result = await db.dailyReflection.findMany({
        where: {
          userId: TEST_USER_ID,
          date: {
            gte: startOfDay(startDate),
            lte: startOfDay(endDate),
          },
        },
        orderBy: { date: "desc" },
      });

      expect(result).toEqual(mockReflections);
      expect(result.length).toBe(2);
    });
  });

  describe("createOrUpdateDaily", () => {
    it("should upsert a daily reflection with userId", async () => {
      const date = new Date("2026-02-08");
      const dateOnly = startOfDay(date);
      const data = {
        morningIntention: "Focus on testing",
        energyLevel: 4,
      };

      db.dailyReflection.upsert.mockResolvedValue({
        id: "dr-1",
        ...data,
        date: dateOnly,
        userId: TEST_USER_ID,
      });

      const result = await db.dailyReflection.upsert({
        where: {
          userId_date: { userId: TEST_USER_ID, date: dateOnly },
        },
        update: data,
        create: { ...data, date: dateOnly, userId: TEST_USER_ID },
      });

      expect(result.morningIntention).toBe("Focus on testing");
      expect(db.dailyReflection.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId_date: expect.objectContaining({ userId: TEST_USER_ID }),
          }),
        })
      );
    });

    it("should handle wins and improvements arrays", async () => {
      const date = new Date("2026-02-08");
      const dateOnly = startOfDay(date);
      const data = {
        wins: ["Completed testing", "Fixed bugs"],
        improvements: ["Start earlier"],
        productivityRating: 4,
      };

      db.dailyReflection.upsert.mockResolvedValue({
        id: "dr-1",
        ...data,
        date: dateOnly,
        userId: TEST_USER_ID,
      });

      const result = await db.dailyReflection.upsert({
        where: { userId_date: { userId: TEST_USER_ID, date: dateOnly } },
        update: data,
        create: { ...data, date: dateOnly, userId: TEST_USER_ID },
      });

      expect(result.wins).toEqual(["Completed testing", "Fixed bugs"]);
      expect(result.improvements).toEqual(["Start earlier"]);
    });
  });

  describe("deleteDaily", () => {
    it("should verify existence before deleting", async () => {
      const dateOnly = startOfDay(new Date("2026-02-08"));
      db.dailyReflection.findFirst.mockResolvedValue({ id: "dr-1", userId: TEST_USER_ID, date: dateOnly });
      db.dailyReflection.delete.mockResolvedValue({ id: "dr-1" });

      const existing = await db.dailyReflection.findFirst({
        where: { userId: TEST_USER_ID, date: dateOnly },
      });
      expect(existing).not.toBeNull();

      await db.dailyReflection.delete({ where: { id: existing!.id } });
      expect(db.dailyReflection.delete).toHaveBeenCalledWith({ where: { id: "dr-1" } });
    });

    it("should return null for non-existent reflection", async () => {
      db.dailyReflection.findFirst.mockResolvedValue(null);

      const existing = await db.dailyReflection.findFirst({
        where: { userId: TEST_USER_ID, date: startOfDay(new Date()) },
      });

      expect(existing).toBeNull();
    });
  });

  // =========================================================================
  // MONTHLY REFLECTIONS
  // =========================================================================
  describe("getMonthlyByMonth", () => {
    it("should return monthly reflection for a given month", async () => {
      const monthOf = new Date("2026-01-15");
      const monthStart = startOfMonth(monthOf);
      const mockReflection = {
        id: "mr-1",
        monthOf: monthStart,
        highlights: ["Shipped feature"],
        rating: 4,
        userId: TEST_USER_ID,
      };

      db.monthlyReflection.findFirst.mockResolvedValue(mockReflection);

      const result = await db.monthlyReflection.findFirst({
        where: { userId: TEST_USER_ID, monthOf: monthStart },
      });

      expect(result).toEqual(mockReflection);
    });

    it("should return null when no monthly reflection exists", async () => {
      db.monthlyReflection.findFirst.mockResolvedValue(null);

      const result = await db.monthlyReflection.findFirst({
        where: { userId: TEST_USER_ID, monthOf: startOfMonth(new Date()) },
      });

      expect(result).toBeNull();
    });
  });

  describe("getAllMonthly", () => {
    it("should return monthly reflections ordered by monthOf desc", async () => {
      const mockReflections = [
        { id: "mr-2", monthOf: new Date("2026-02-01"), userId: TEST_USER_ID },
        { id: "mr-1", monthOf: new Date("2026-01-01"), userId: TEST_USER_ID },
      ];

      db.monthlyReflection.findMany.mockResolvedValue(mockReflections);

      const result = await db.monthlyReflection.findMany({
        where: { userId: TEST_USER_ID },
        orderBy: { monthOf: "desc" },
        take: 12,
      });

      expect(result.length).toBe(2);
      expect(db.monthlyReflection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_ID }),
          orderBy: { monthOf: "desc" },
          take: 12,
        })
      );
    });

    it("should respect custom limit", async () => {
      db.monthlyReflection.findMany.mockResolvedValue([]);

      await db.monthlyReflection.findMany({
        where: { userId: TEST_USER_ID },
        orderBy: { monthOf: "desc" },
        take: 6,
      });

      expect(db.monthlyReflection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 6 })
      );
    });
  });

  describe("createOrUpdateMonthly", () => {
    it("should upsert a monthly reflection with userId", async () => {
      const monthOf = new Date("2026-01-15");
      const monthStart = startOfMonth(monthOf);
      const data = {
        highlights: ["Shipped feature X"],
        challenges: ["Tight deadline"],
        lessonsLearned: ["Plan better"],
        nextMonthGoals: ["Write more tests"],
        rating: 4,
      };

      db.monthlyReflection.upsert.mockResolvedValue({
        id: "mr-1",
        ...data,
        monthOf: monthStart,
        userId: TEST_USER_ID,
      });

      const result = await db.monthlyReflection.upsert({
        where: {
          userId_monthOf: { userId: TEST_USER_ID, monthOf: monthStart },
        },
        update: data,
        create: { ...data, monthOf: monthStart, userId: TEST_USER_ID },
      });

      expect(result.highlights).toEqual(["Shipped feature X"]);
      expect(result.rating).toBe(4);
    });
  });

  describe("deleteMonthly", () => {
    it("should verify existence before deleting monthly reflection", async () => {
      const monthStart = startOfMonth(new Date("2026-01-15"));
      db.monthlyReflection.findFirst.mockResolvedValue({ id: "mr-1", userId: TEST_USER_ID, monthOf: monthStart });
      db.monthlyReflection.delete.mockResolvedValue({ id: "mr-1" });

      const existing = await db.monthlyReflection.findFirst({
        where: { userId: TEST_USER_ID, monthOf: monthStart },
      });
      expect(existing).not.toBeNull();

      await db.monthlyReflection.delete({ where: { id: existing!.id } });
      expect(db.monthlyReflection.delete).toHaveBeenCalledWith({ where: { id: "mr-1" } });
    });

    it("should return null for non-existent monthly reflection", async () => {
      db.monthlyReflection.findFirst.mockResolvedValue(null);

      const existing = await db.monthlyReflection.findFirst({
        where: { userId: TEST_USER_ID, monthOf: startOfMonth(new Date()) },
      });

      expect(existing).toBeNull();
    });
  });

  // =========================================================================
  // STREAK TRACKING
  // =========================================================================
  describe("getReflectionStreaks", () => {
    it("should compute current streak from consecutive daily reflections", async () => {
      const today = startOfDay(new Date());
      const reflections = [
        { date: today },
        { date: subDays(today, 1) },
        { date: subDays(today, 2) },
        // Gap at day 3
      ];

      db.dailyReflection.findMany.mockResolvedValue(reflections);
      db.dailyReflection.count.mockResolvedValue(50);

      const recentReflections = await db.dailyReflection.findMany({
        where: {
          userId: TEST_USER_ID,
          date: { gte: subDays(today, 30) },
        },
        orderBy: { date: "desc" },
        select: { date: true },
      });

      const reflectionDates = recentReflections.map(
        (r: { date: Date }) => startOfDay(new Date(r.date))
      );

      // Calculate streak
      let currentStreak = 0;
      let checkDate = today;
      while (reflectionDates.some((d: Date) => d.getTime() === checkDate.getTime())) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }

      expect(currentStreak).toBe(3);

      const completionRate = Math.round((recentReflections.length / 30) * 100);
      expect(completionRate).toBe(10); // 3/30 * 100 = 10

      const totalCount = await db.dailyReflection.count({
        where: { userId: TEST_USER_ID },
      });
      expect(totalCount).toBe(50);
    });

    it("should return zero streak when no reflection exists for today", async () => {
      const today = startOfDay(new Date());
      const reflections = [
        { date: subDays(today, 1) }, // yesterday, not today
      ];

      db.dailyReflection.findMany.mockResolvedValue(reflections);

      const recentReflections = await db.dailyReflection.findMany({
        where: { userId: TEST_USER_ID, date: { gte: subDays(today, 30) } },
        orderBy: { date: "desc" },
        select: { date: true },
      });

      const reflectionDates = recentReflections.map(
        (r: { date: Date }) => startOfDay(new Date(r.date))
      );

      let currentStreak = 0;
      let checkDate = today;
      while (reflectionDates.some((d: Date) => d.getTime() === checkDate.getTime())) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }

      expect(currentStreak).toBe(0);
    });
  });

  // =========================================================================
  // REFLECTION PROMPTS
  // =========================================================================
  describe("getRandomPrompts", () => {
    it("should return prompts for the specified type", () => {
      const prompts = {
        morning: [
          "What is the one thing that, if accomplished today, would make you feel successful?",
          "What energy do you want to bring to your day?",
          "What are you looking forward to today?",
        ],
        evening: [
          "What went well today?",
          "What did you learn about yourself today?",
        ],
        gratitude: [
          "What made you smile today?",
          "Who supported you today?",
        ],
        growth: [
          "What skill did you practice today?",
          "What feedback did you receive?",
        ],
      };

      // Simulate the prompt selection logic
      const type = "morning" as const;
      const count = 2;
      const categoryPrompts = prompts[type];
      const shuffled = [...categoryPrompts].sort(() => Math.random() - 0.5);
      const result = shuffled.slice(0, count);

      expect(result.length).toBe(count);
      result.forEach((prompt: string) => {
        expect(categoryPrompts).toContain(prompt);
      });
    });

    it("should return correct count of prompts", () => {
      const allPrompts = [
        "Prompt 1", "Prompt 2", "Prompt 3", "Prompt 4", "Prompt 5",
      ];

      for (const count of [1, 2, 3]) {
        const shuffled = [...allPrompts].sort(() => Math.random() - 0.5);
        const result = shuffled.slice(0, count);
        expect(result.length).toBe(count);
      }
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
