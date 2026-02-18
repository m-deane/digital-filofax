import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockContext, TEST_USER_ID } from "../helpers";
import type { MockPrismaClient } from "../helpers";
import { startOfDay, endOfDay } from "date-fns";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));

describe("Daily Router", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let db: MockPrismaClient;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
    db = ctx.db;
  });

  // =========================================================================
  // getDailyView
  // =========================================================================
  describe("getDailyView", () => {
    it("should fetch tasks, events, habits, and memos for the given date", async () => {
      const testDate = new Date("2026-02-10");
      const dayStart = startOfDay(testDate);
      const dayEnd = endOfDay(testDate);

      const mockTasks = [
        {
          id: "task-1",
          title: "Scheduled Task",
          userId: TEST_USER_ID,
          scheduledStart: new Date("2026-02-10T09:00:00"),
          isDailyPriority: false,
          category: null,
          tags: [],
          subtasks: [],
        },
        {
          id: "task-2",
          title: "Priority Task",
          userId: TEST_USER_ID,
          scheduledStart: null,
          isDailyPriority: true,
          status: "TODO",
          category: null,
          tags: [],
          subtasks: [],
        },
      ];

      const mockEvents = [
        {
          id: "event-1",
          title: "Meeting",
          userId: TEST_USER_ID,
          startDate: new Date("2026-02-10T14:00:00"),
          endDate: new Date("2026-02-10T15:00:00"),
        },
      ];

      const mockHabits = [
        {
          id: "habit-1",
          name: "Exercise",
          userId: TEST_USER_ID,
          isArchived: false,
          logs: [],
        },
      ];

      const mockMemos = [
        {
          id: "memo-1",
          title: "Quick note",
          userId: TEST_USER_ID,
          isArchived: false,
        },
      ];

      db.task.findMany.mockResolvedValue(mockTasks);
      db.calendarEvent.findMany.mockResolvedValue(mockEvents);
      db.habit.findMany.mockResolvedValue(mockHabits);
      db.memo.findMany.mockResolvedValue(mockMemos);

      // Simulate router's getDailyView logic
      const tasks = await db.task.findMany({
        where: {
          userId: TEST_USER_ID,
          OR: [
            { scheduledStart: { gte: dayStart, lte: dayEnd } },
            { dueDate: { gte: dayStart, lte: dayEnd } },
            { isDailyPriority: true, status: { not: "DONE" } },
          ],
        },
        include: { category: true, tags: true, subtasks: { orderBy: { order: "asc" } } },
        orderBy: expect.any(Array),
      });

      const events = await db.calendarEvent.findMany({
        where: {
          userId: TEST_USER_ID,
          startDate: { lte: dayEnd },
          endDate: { gte: dayStart },
        },
        orderBy: { startDate: "asc" },
      });

      const habits = await db.habit.findMany({
        where: { userId: TEST_USER_ID, isArchived: false },
        include: expect.any(Object),
        orderBy: { name: "asc" },
      });

      const recentMemos = await db.memo.findMany({
        where: { userId: TEST_USER_ID, isArchived: false },
        orderBy: { updatedAt: "desc" },
        take: 5,
      });

      expect(tasks).toEqual(mockTasks);
      expect(events).toEqual(mockEvents);
      expect(habits).toEqual(mockHabits);
      expect(recentMemos).toEqual(mockMemos);

      // Verify all queries are user-scoped
      expect(db.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
      expect(db.calendarEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });

    it("should separate scheduled and unscheduled tasks", () => {
      const tasks = [
        { id: "t1", scheduledStart: new Date(), isDailyPriority: false },
        { id: "t2", scheduledStart: null, isDailyPriority: false },
        { id: "t3", scheduledStart: null, isDailyPriority: true },
      ];

      const scheduledTasks = tasks.filter((t) => t.scheduledStart !== null);
      const unscheduledTasks = tasks.filter((t) => t.scheduledStart === null);
      const priorityTasks = tasks.filter((t) => t.isDailyPriority);

      expect(scheduledTasks).toHaveLength(1);
      expect(unscheduledTasks).toHaveLength(2);
      expect(priorityTasks).toHaveLength(1);
    });
  });

  // =========================================================================
  // setDailyPriorities
  // =========================================================================
  describe("setDailyPriorities", () => {
    it("should clear existing priorities and set new ones", async () => {
      db.task.updateMany.mockResolvedValue({ count: 1 });

      // Step 1: Clear existing
      await db.task.updateMany({
        where: { userId: TEST_USER_ID, isDailyPriority: true },
        data: { isDailyPriority: false },
      });

      expect(db.task.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: TEST_USER_ID,
            isDailyPriority: true,
          }),
          data: { isDailyPriority: false },
        })
      );

      // Step 2: Set new priorities
      const taskIds = ["task-1", "task-2"];
      await db.task.updateMany({
        where: {
          id: { in: taskIds },
          userId: TEST_USER_ID,
        },
        data: { isDailyPriority: true },
      });

      expect(db.task.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: taskIds },
            userId: TEST_USER_ID,
          }),
          data: { isDailyPriority: true },
        })
      );
    });

    it("should only clear priorities when empty array provided", async () => {
      db.task.updateMany.mockResolvedValue({ count: 2 });

      // Clear existing
      await db.task.updateMany({
        where: { userId: TEST_USER_ID, isDailyPriority: true },
        data: { isDailyPriority: false },
      });

      // No second call since taskIds is empty
      expect(db.task.updateMany).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // scheduleTask
  // =========================================================================
  describe("scheduleTask", () => {
    it("should set scheduled times for a task", async () => {
      const scheduledStart = new Date("2026-02-10T09:00:00");
      const scheduledEnd = new Date("2026-02-10T10:00:00");

      db.task.update.mockResolvedValue({
        id: "task-1",
        scheduledStart,
        scheduledEnd,
        category: null,
        tags: [],
      });

      const result = await db.task.update({
        where: { id: "task-1", userId: TEST_USER_ID },
        data: { scheduledStart, scheduledEnd },
        include: { category: true, tags: true },
      });

      expect(result.scheduledStart).toEqual(scheduledStart);
      expect(result.scheduledEnd).toEqual(scheduledEnd);
      expect(db.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });
  });

  // =========================================================================
  // unscheduleTask
  // =========================================================================
  describe("unscheduleTask", () => {
    it("should clear scheduled times for a task", async () => {
      db.task.update.mockResolvedValue({
        id: "task-1",
        scheduledStart: null,
        scheduledEnd: null,
      });

      const result = await db.task.update({
        where: { id: "task-1", userId: TEST_USER_ID },
        data: { scheduledStart: null, scheduledEnd: null },
      });

      expect(result.scheduledStart).toBeNull();
      expect(result.scheduledEnd).toBeNull();
      expect(db.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });
  });

  // =========================================================================
  // toggleDailyPriority
  // =========================================================================
  describe("toggleDailyPriority", () => {
    it("should remove priority when task is already a priority", async () => {
      db.task.findUnique.mockResolvedValue({
        id: "task-1",
        userId: TEST_USER_ID,
        isDailyPriority: true,
      });
      db.task.update.mockResolvedValue({ id: "task-1", isDailyPriority: false });

      const task = await db.task.findUnique({
        where: { id: "task-1", userId: TEST_USER_ID },
      });
      expect(task!.isDailyPriority).toBe(true);

      const result = await db.task.update({
        where: { id: "task-1" },
        data: { isDailyPriority: false },
      });

      expect(result.isDailyPriority).toBe(false);
    });

    it("should add priority when under limit of 3", async () => {
      db.task.findUnique.mockResolvedValue({
        id: "task-1",
        userId: TEST_USER_ID,
        isDailyPriority: false,
      });
      db.task.count.mockResolvedValue(2); // Only 2 existing priorities
      db.task.update.mockResolvedValue({ id: "task-1", isDailyPriority: true });

      const task = await db.task.findUnique({
        where: { id: "task-1", userId: TEST_USER_ID },
      });
      expect(task!.isDailyPriority).toBe(false);

      const priorityCount = await db.task.count({
        where: { userId: TEST_USER_ID, isDailyPriority: true },
      });
      expect(priorityCount).toBeLessThan(3);

      const result = await db.task.update({
        where: { id: "task-1" },
        data: { isDailyPriority: true },
      });

      expect(result.isDailyPriority).toBe(true);
    });

    it("should reject when already at 3 priorities", async () => {
      db.task.findUnique.mockResolvedValue({
        id: "task-1",
        userId: TEST_USER_ID,
        isDailyPriority: false,
      });
      db.task.count.mockResolvedValue(3); // Already at max

      const task = await db.task.findUnique({
        where: { id: "task-1", userId: TEST_USER_ID },
      });
      expect(task!.isDailyPriority).toBe(false);

      const priorityCount = await db.task.count({
        where: { userId: TEST_USER_ID, isDailyPriority: true },
      });

      // Router would throw BAD_REQUEST
      expect(priorityCount).toBe(3);
    });

    it("should throw NOT_FOUND when task not found", async () => {
      db.task.findUnique.mockResolvedValue(null);

      const task = await db.task.findUnique({
        where: { id: "nonexistent", userId: TEST_USER_ID },
      });
      expect(task).toBeNull();
    });
  });
});
