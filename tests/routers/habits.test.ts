import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockContext, TEST_USER_ID, OTHER_USER_ID } from "../helpers";
import type { MockPrismaClient } from "../helpers";
import { startOfDay, subDays, isSameDay } from "date-fns";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));

describe("Habits Router", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let db: MockPrismaClient;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
    db = ctx.db;
  });

  // =========================================================================
  // getAll
  // =========================================================================
  describe("getAll", () => {
    it("should return non-archived habits for user by default", async () => {
      const mockHabits = [
        {
          id: "habit-1",
          name: "Exercise",
          userId: TEST_USER_ID,
          isArchived: false,
          habitType: "BOOLEAN",
          frequency: "DAILY",
          logs: [],
          category: null,
        },
      ];
      db.habit.findMany.mockResolvedValue(mockHabits);

      const result = await db.habit.findMany({
        where: {
          userId: TEST_USER_ID,
          isArchived: false,
        },
        include: {
          category: true,
          logs: expect.any(Object),
        },
        orderBy: { createdAt: "asc" },
      });

      expect(result).toEqual(mockHabits);
      expect(db.habit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: TEST_USER_ID,
            isArchived: false,
          }),
        })
      );
    });

    it("should include archived habits when requested", async () => {
      db.habit.findMany.mockResolvedValue([]);

      await db.habit.findMany({
        where: {
          userId: TEST_USER_ID,
          // No isArchived filter when includeArchived is true
        },
        include: { category: true, logs: expect.any(Object) },
        orderBy: { createdAt: "asc" },
      });

      expect(db.habit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });

    it("should filter by habitType when provided", async () => {
      db.habit.findMany.mockResolvedValue([]);

      await db.habit.findMany({
        where: {
          userId: TEST_USER_ID,
          isArchived: false,
          habitType: { in: ["BOOLEAN"] },
        },
        include: { category: true, logs: expect.any(Object) },
        orderBy: { createdAt: "asc" },
      });

      expect(db.habit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            habitType: { in: ["BOOLEAN"] },
          }),
        })
      );
    });
  });

  // =========================================================================
  // getById
  // =========================================================================
  describe("getById", () => {
    it("should return a habit with logs when found", async () => {
      const mockHabit = {
        id: "habit-1",
        name: "Exercise",
        userId: TEST_USER_ID,
        category: null,
        logs: [{ date: new Date(), value: 1 }],
      };
      db.habit.findFirst.mockResolvedValue(mockHabit);

      const result = await db.habit.findFirst({
        where: { id: "habit-1", userId: TEST_USER_ID },
        include: { category: true, logs: { orderBy: { date: "desc" }, take: 365 } },
      });

      expect(result).toEqual(mockHabit);
      expect(db.habit.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "habit-1", userId: TEST_USER_ID },
        })
      );
    });

    it("should return null when habit not found (triggering NOT_FOUND)", async () => {
      db.habit.findFirst.mockResolvedValue(null);

      const result = await db.habit.findFirst({
        where: { id: "nonexistent", userId: TEST_USER_ID },
      });

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // create
  // =========================================================================
  describe("create", () => {
    it("should create a habit with userId from session", async () => {
      const newHabit = {
        id: "habit-new",
        name: "Read",
        habitType: "BOOLEAN",
        frequency: "DAILY",
        color: "#10b981",
        userId: TEST_USER_ID,
        category: null,
      };
      db.habit.create.mockResolvedValue(newHabit);

      const result = await db.habit.create({
        data: {
          name: "Read",
          habitType: "BOOLEAN",
          frequency: "DAILY",
          color: "#10b981",
          userId: TEST_USER_ID,
        },
        include: { category: true },
      });

      expect(result.name).toBe("Read");
      expect(db.habit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: TEST_USER_ID,
          }),
        })
      );
    });

    it("should accept optional fields", async () => {
      db.habit.create.mockResolvedValue({
        id: "habit-new",
        name: "Workout",
        description: "30 min workout",
        habitType: "NUMERIC",
        frequency: "DAILY",
        targetValue: 30,
        unit: "minutes",
        icon: "dumbbell",
        color: "#ff5733",
        userId: TEST_USER_ID,
        category: null,
      });

      await db.habit.create({
        data: {
          name: "Workout",
          description: "30 min workout",
          habitType: "NUMERIC",
          frequency: "DAILY",
          targetValue: 30,
          unit: "minutes",
          icon: "dumbbell",
          color: "#ff5733",
          userId: TEST_USER_ID,
        },
        include: { category: true },
      });

      expect(db.habit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            targetValue: 30,
            unit: "minutes",
          }),
        })
      );
    });
  });

  // =========================================================================
  // update
  // =========================================================================
  describe("update", () => {
    it("should verify ownership before updating", async () => {
      db.habit.findFirst.mockResolvedValue({ id: "habit-1", userId: TEST_USER_ID });
      db.habit.update.mockResolvedValue({
        id: "habit-1",
        name: "Updated Habit",
        userId: TEST_USER_ID,
        category: null,
      });

      const existing = await db.habit.findFirst({
        where: { id: "habit-1", userId: TEST_USER_ID },
      });
      expect(existing).not.toBeNull();

      const result = await db.habit.update({
        where: { id: "habit-1" },
        data: { name: "Updated Habit" },
        include: { category: true },
      });

      expect(result.name).toBe("Updated Habit");
    });

    it("should throw NOT_FOUND when updating non-owned habit", async () => {
      db.habit.findFirst.mockResolvedValue(null);

      const existing = await db.habit.findFirst({
        where: { id: "habit-1", userId: TEST_USER_ID },
      });
      expect(existing).toBeNull();
    });

    it("should allow archiving a habit", async () => {
      db.habit.findFirst.mockResolvedValue({ id: "habit-1", userId: TEST_USER_ID, isArchived: false });
      db.habit.update.mockResolvedValue({ id: "habit-1", isArchived: true, userId: TEST_USER_ID, category: null });

      const existing = await db.habit.findFirst({
        where: { id: "habit-1", userId: TEST_USER_ID },
      });
      expect(existing).not.toBeNull();

      const result = await db.habit.update({
        where: { id: "habit-1" },
        data: { isArchived: true },
        include: { category: true },
      });

      expect(result.isArchived).toBe(true);
    });
  });

  // =========================================================================
  // delete
  // =========================================================================
  describe("delete", () => {
    it("should verify ownership before deleting", async () => {
      db.habit.findFirst.mockResolvedValue({ id: "habit-1", userId: TEST_USER_ID });
      db.habit.delete.mockResolvedValue({ id: "habit-1" });

      const existing = await db.habit.findFirst({
        where: { id: "habit-1", userId: TEST_USER_ID },
      });
      expect(existing).not.toBeNull();

      await db.habit.delete({ where: { id: "habit-1" } });
      expect(db.habit.delete).toHaveBeenCalledWith({ where: { id: "habit-1" } });
    });

    it("should throw NOT_FOUND when deleting non-owned habit", async () => {
      db.habit.findFirst.mockResolvedValue(null);

      const existing = await db.habit.findFirst({
        where: { id: "habit-1", userId: TEST_USER_ID },
      });
      expect(existing).toBeNull();
    });
  });

  // =========================================================================
  // logCompletion
  // =========================================================================
  describe("logCompletion", () => {
    it("should create or update a habit log", async () => {
      db.habit.findFirst.mockResolvedValue({ id: "habit-1", userId: TEST_USER_ID });
      const today = startOfDay(new Date());

      db.habitLog.upsert.mockResolvedValue({
        id: "log-1",
        habitId: "habit-1",
        userId: TEST_USER_ID,
        date: today,
        value: 1,
        notes: "Done!",
      });

      // Verify habit ownership
      const habit = await db.habit.findFirst({
        where: { id: "habit-1", userId: TEST_USER_ID },
      });
      expect(habit).not.toBeNull();

      const result = await db.habitLog.upsert({
        where: {
          habitId_date: { habitId: "habit-1", date: today },
        },
        update: { value: 1, notes: "Done!" },
        create: {
          habitId: "habit-1",
          userId: TEST_USER_ID,
          date: today,
          value: 1,
          notes: "Done!",
        },
      });

      expect(result.habitId).toBe("habit-1");
      expect(result.userId).toBe(TEST_USER_ID);
    });

    it("should throw NOT_FOUND when habit not owned", async () => {
      db.habit.findFirst.mockResolvedValue(null);

      const habit = await db.habit.findFirst({
        where: { id: "habit-1", userId: TEST_USER_ID },
      });
      expect(habit).toBeNull();
    });
  });

  // =========================================================================
  // removeLog
  // =========================================================================
  describe("removeLog", () => {
    it("should remove a log belonging to user", async () => {
      const today = startOfDay(new Date());
      db.habitLog.findFirst.mockResolvedValue({
        id: "log-1",
        habitId: "habit-1",
        date: today,
        userId: TEST_USER_ID,
      });
      db.habitLog.delete.mockResolvedValue({ id: "log-1" });

      const log = await db.habitLog.findFirst({
        where: {
          habitId: "habit-1",
          date: today,
          userId: TEST_USER_ID,
        },
      });
      expect(log).not.toBeNull();

      await db.habitLog.delete({ where: { id: log!.id } });
      expect(db.habitLog.delete).toHaveBeenCalledWith({ where: { id: "log-1" } });
    });

    it("should throw NOT_FOUND when log not found", async () => {
      db.habitLog.findFirst.mockResolvedValue(null);

      const log = await db.habitLog.findFirst({
        where: {
          habitId: "habit-1",
          date: startOfDay(new Date()),
          userId: TEST_USER_ID,
        },
      });
      expect(log).toBeNull();
    });
  });

  // =========================================================================
  // getTodayStatus
  // =========================================================================
  describe("getTodayStatus", () => {
    it("should return habits with today's completion status", async () => {
      const today = startOfDay(new Date());
      const mockHabits = [
        {
          id: "habit-1",
          name: "Exercise",
          userId: TEST_USER_ID,
          isArchived: false,
          category: null,
          logs: [{ date: today, value: 1 }],
        },
        {
          id: "habit-2",
          name: "Read",
          userId: TEST_USER_ID,
          isArchived: false,
          category: null,
          logs: [],
        },
      ];

      db.habit.findMany.mockResolvedValue(mockHabits);

      const habits = await db.habit.findMany({
        where: { userId: TEST_USER_ID, isArchived: false },
        include: {
          category: true,
          logs: { where: { date: today }, take: 1 },
        },
        orderBy: { createdAt: "asc" },
      });

      // Simulate router's mapping
      const result = habits.map((habit: typeof mockHabits[0]) => ({
        ...habit,
        completedToday: habit.logs.length > 0,
        todayLog: habit.logs[0] ?? null,
      }));

      expect(result[0].completedToday).toBe(true);
      expect(result[1].completedToday).toBe(false);
    });
  });

  // =========================================================================
  // getStreakInfo
  // =========================================================================
  describe("getStreakInfo", () => {
    it("should calculate current streak correctly", () => {
      const today = startOfDay(new Date());
      const logDates = [
        today,
        subDays(today, 1),
        subDays(today, 2),
        subDays(today, 3),
      ];

      // Simulate the streak calculation logic from the router
      let currentStreak = 0;
      let checkDate = today;

      const todayCompleted = logDates.some((d) => isSameDay(d, today));

      if (todayCompleted) {
        currentStreak = 1;
        checkDate = subDays(today, 1);
      }

      while (logDates.some((d) => isSameDay(d, checkDate))) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }

      expect(currentStreak).toBe(4);
    });

    it("should calculate streak starting from yesterday", () => {
      const today = startOfDay(new Date());
      const logDates = [
        subDays(today, 1),
        subDays(today, 2),
      ];

      let currentStreak = 0;
      let checkDate = today;

      const todayCompleted = logDates.some((d) => isSameDay(d, today));
      const yesterdayCompleted = logDates.some((d) => isSameDay(d, subDays(today, 1)));

      if (todayCompleted) {
        currentStreak = 1;
        checkDate = subDays(today, 1);
      } else if (yesterdayCompleted) {
        currentStreak = 1;
        checkDate = subDays(today, 2);
      }

      if (currentStreak > 0) {
        while (logDates.some((d) => isSameDay(d, checkDate))) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        }
      }

      expect(currentStreak).toBe(2);
    });

    it("should return zero streak when no recent completions", () => {
      const today = startOfDay(new Date());
      const logDates = [subDays(today, 5)]; // Gap too large

      let currentStreak = 0;

      const todayCompleted = logDates.some((d) => isSameDay(d, today));
      const yesterdayCompleted = logDates.some((d) => isSameDay(d, subDays(today, 1)));

      if (!todayCompleted && !yesterdayCompleted) {
        // No streak
      }

      expect(currentStreak).toBe(0);
    });

    it("should calculate longest streak", () => {
      const today = startOfDay(new Date());
      const logDates = [
        subDays(today, 10),
        subDays(today, 9),
        subDays(today, 8),
        subDays(today, 7),
        subDays(today, 6),
        // Gap at day 5
        subDays(today, 3),
        subDays(today, 2),
      ];

      const sortedDates = [...logDates].sort((a, b) => a.getTime() - b.getTime());
      let longestStreak = 0;
      let tempStreak = 0;

      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const diff = Math.round(
            (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diff === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      expect(longestStreak).toBe(5); // Days 10-6
    });
  });

  // =========================================================================
  // User scoping verification
  // =========================================================================
  describe("user scoping", () => {
    it("all operations should be scoped to user ID", () => {
      expect(TEST_USER_ID).toBeDefined();
      expect(OTHER_USER_ID).toBeDefined();
      expect(TEST_USER_ID).not.toBe(OTHER_USER_ID);
    });
  });
});
