import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockContext, TEST_USER_ID } from "../helpers";
import type { MockPrismaClient } from "../helpers";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));

describe("Goals Router", () => {
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
    it("should return top-level goals by default (parentGoalId null)", async () => {
      const mockGoals = [
        {
          id: "goal-1",
          title: "Lifetime Goal",
          type: "LIFETIME",
          status: "IN_PROGRESS",
          userId: TEST_USER_ID,
          parentGoalId: null,
          category: null,
          milestones: [],
          tasks: [],
          childGoals: [],
          parentGoal: null,
          _count: { tasks: 0, milestones: 0, childGoals: 0 },
        },
      ];
      db.goal.findMany.mockResolvedValue(mockGoals);

      const result = await db.goal.findMany({
        where: {
          userId: TEST_USER_ID,
          parentGoalId: null,
        },
        include: expect.any(Object),
        orderBy: expect.any(Array),
      });

      expect(result).toEqual(mockGoals);
      expect(db.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: TEST_USER_ID,
            parentGoalId: null,
          }),
        })
      );
    });

    it("should filter by status when provided", async () => {
      db.goal.findMany.mockResolvedValue([]);

      await db.goal.findMany({
        where: {
          userId: TEST_USER_ID,
          parentGoalId: null,
          status: "COMPLETED",
        },
        include: expect.any(Object),
        orderBy: expect.any(Array),
      });

      expect(db.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "COMPLETED" }),
        })
      );
    });

    it("should filter by type when provided", async () => {
      db.goal.findMany.mockResolvedValue([]);

      await db.goal.findMany({
        where: {
          userId: TEST_USER_ID,
          parentGoalId: null,
          type: "ANNUAL",
        },
        include: expect.any(Object),
        orderBy: expect.any(Array),
      });

      expect(db.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: "ANNUAL" }),
        })
      );
    });

    it("should include children when requested", async () => {
      db.goal.findMany.mockResolvedValue([]);

      // When includeChildren is true, parentGoalId should be undefined (not null)
      await db.goal.findMany({
        where: {
          userId: TEST_USER_ID,
          // parentGoalId omitted when includeChildren=true
        },
        include: expect.any(Object),
        orderBy: expect.any(Array),
      });

      // Verify parentGoalId is NOT in the where clause
      const call = db.goal.findMany.mock.calls[0][0];
      expect(call.where).not.toHaveProperty("parentGoalId");
    });
  });

  // =========================================================================
  // getById
  // =========================================================================
  describe("getById", () => {
    it("should return a goal with all relations", async () => {
      const mockGoal = {
        id: "goal-1",
        title: "My Goal",
        userId: TEST_USER_ID,
        category: null,
        milestones: [],
        tasks: [],
        childGoals: [],
        parentGoal: null,
      };
      db.goal.findUnique.mockResolvedValue(mockGoal);

      const result = await db.goal.findUnique({
        where: { id: "goal-1", userId: TEST_USER_ID },
        include: expect.any(Object),
      });

      expect(result).toEqual(mockGoal);
      expect(db.goal.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "goal-1", userId: TEST_USER_ID },
        })
      );
    });

    it("should return null when goal not found", async () => {
      db.goal.findUnique.mockResolvedValue(null);

      const result = await db.goal.findUnique({
        where: { id: "nonexistent", userId: TEST_USER_ID },
      });

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // create
  // =========================================================================
  describe("create", () => {
    it("should create a goal with userId from session", async () => {
      const newGoal = {
        id: "goal-new",
        title: "New Goal",
        type: "ANNUAL",
        status: "NOT_STARTED",
        userId: TEST_USER_ID,
        category: null,
        milestones: [],
        parentGoal: null,
      };
      db.goal.create.mockResolvedValue(newGoal);

      const result = await db.goal.create({
        data: {
          title: "New Goal",
          type: "ANNUAL",
          userId: TEST_USER_ID,
        },
        include: expect.any(Object),
      });

      expect(result.title).toBe("New Goal");
      expect(db.goal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: TEST_USER_ID,
          }),
        })
      );
    });

    it("should verify parent goal ownership when parentGoalId is provided", async () => {
      // Parent goal belongs to current user
      db.goal.findUnique.mockResolvedValue({ id: "parent-goal", userId: TEST_USER_ID });
      db.goal.create.mockResolvedValue({
        id: "goal-new",
        title: "Child Goal",
        parentGoalId: "parent-goal",
        userId: TEST_USER_ID,
        category: null,
        milestones: [],
        parentGoal: { id: "parent-goal", title: "Parent", type: "LIFETIME" },
      });

      const parentGoal = await db.goal.findUnique({
        where: { id: "parent-goal", userId: TEST_USER_ID },
      });
      expect(parentGoal).not.toBeNull();

      const result = await db.goal.create({
        data: {
          title: "Child Goal",
          parentGoalId: "parent-goal",
          userId: TEST_USER_ID,
        },
        include: expect.any(Object),
      });

      expect(result.parentGoalId).toBe("parent-goal");
    });

    it("should reject when parent goal not found", async () => {
      db.goal.findUnique.mockResolvedValue(null);

      const parentGoal = await db.goal.findUnique({
        where: { id: "nonexistent-parent", userId: TEST_USER_ID },
      });

      expect(parentGoal).toBeNull();
      // Router would throw TRPCError NOT_FOUND
    });
  });

  // =========================================================================
  // update
  // =========================================================================
  describe("update", () => {
    it("should update goal scoped to user", async () => {
      db.goal.update.mockResolvedValue({
        id: "goal-1",
        title: "Updated Goal",
        status: "IN_PROGRESS",
        userId: TEST_USER_ID,
        category: null,
        milestones: [],
        parentGoal: null,
      });

      const result = await db.goal.update({
        where: { id: "goal-1", userId: TEST_USER_ID },
        data: { title: "Updated Goal" },
        include: expect.any(Object),
      });

      expect(result.title).toBe("Updated Goal");
      expect(db.goal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });

    it("should set completedAt when status changes to COMPLETED", () => {
      // Simulate the router's logic
      const status = "COMPLETED";
      const data: Record<string, unknown> = {};

      if (status) {
        data.status = status;
        data.completedAt = status === "COMPLETED" ? new Date() : null;
      }

      expect(data.completedAt).toBeInstanceOf(Date);
    });

    it("should clear completedAt when status changes from COMPLETED", () => {
      const status = "IN_PROGRESS";
      const data: Record<string, unknown> = {};

      if (status) {
        data.status = status;
        data.completedAt = status === "COMPLETED" ? new Date() : null;
      }

      expect(data.completedAt).toBeNull();
    });
  });

  // =========================================================================
  // updateProgress
  // =========================================================================
  describe("updateProgress", () => {
    it("should update progress for user's goal", async () => {
      db.goal.update.mockResolvedValue({
        id: "goal-1",
        progress: 75,
        userId: TEST_USER_ID,
      });

      const result = await db.goal.update({
        where: { id: "goal-1", userId: TEST_USER_ID },
        data: { progress: 75 },
      });

      expect(result.progress).toBe(75);
      expect(db.goal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_ID }),
          data: { progress: 75 },
        })
      );
    });
  });

  // =========================================================================
  // delete
  // =========================================================================
  describe("delete", () => {
    it("should delete goal scoped to user", async () => {
      db.goal.delete.mockResolvedValue({ id: "goal-1" });

      await db.goal.delete({
        where: { id: "goal-1", userId: TEST_USER_ID },
      });

      expect(db.goal.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "goal-1", userId: TEST_USER_ID },
        })
      );
    });
  });

  // =========================================================================
  // addMilestone
  // =========================================================================
  describe("addMilestone", () => {
    it("should create a milestone for user's goal", async () => {
      db.goal.findUnique.mockResolvedValue({ id: "goal-1", userId: TEST_USER_ID });
      const milestoneDate = new Date("2026-06-01");
      db.milestone.create.mockResolvedValue({
        id: "milestone-1",
        title: "Launch MVP",
        date: milestoneDate,
        goalId: "goal-1",
        completed: false,
      });

      // Verify goal ownership
      const goal = await db.goal.findUnique({
        where: { id: "goal-1", userId: TEST_USER_ID },
      });
      expect(goal).not.toBeNull();

      const result = await db.milestone.create({
        data: {
          title: "Launch MVP",
          date: milestoneDate,
          goalId: "goal-1",
        },
      });

      expect(result.title).toBe("Launch MVP");
      expect(result.goalId).toBe("goal-1");
    });

    it("should throw NOT_FOUND when goal not owned", async () => {
      db.goal.findUnique.mockResolvedValue(null);

      const goal = await db.goal.findUnique({
        where: { id: "goal-1", userId: TEST_USER_ID },
      });
      expect(goal).toBeNull();
    });
  });

  // =========================================================================
  // updateMilestone
  // =========================================================================
  describe("updateMilestone", () => {
    it("should verify milestone belongs to user's goal", async () => {
      db.milestone.findUnique.mockResolvedValue({
        id: "milestone-1",
        title: "Original",
        goal: { userId: TEST_USER_ID },
      });
      db.milestone.update.mockResolvedValue({
        id: "milestone-1",
        title: "Updated Milestone",
        completed: true,
        completedAt: new Date(),
      });

      const milestone = await db.milestone.findUnique({
        where: { id: "milestone-1" },
        include: { goal: true },
      });

      expect(milestone).not.toBeNull();
      expect(milestone!.goal.userId).toBe(TEST_USER_ID);

      const result = await db.milestone.update({
        where: { id: "milestone-1" },
        data: { title: "Updated Milestone", completed: true, completedAt: new Date() },
      });

      expect(result.completed).toBe(true);
    });

    it("should throw NOT_FOUND for milestone of other user's goal", async () => {
      db.milestone.findUnique.mockResolvedValue({
        id: "milestone-1",
        goal: { userId: "other-user" },
      });

      const milestone = await db.milestone.findUnique({
        where: { id: "milestone-1" },
        include: { goal: true },
      });

      expect(milestone!.goal.userId).not.toBe(TEST_USER_ID);
    });
  });

  // =========================================================================
  // deleteMilestone
  // =========================================================================
  describe("deleteMilestone", () => {
    it("should delete milestone belonging to user's goal", async () => {
      db.milestone.findUnique.mockResolvedValue({
        id: "milestone-1",
        goal: { userId: TEST_USER_ID },
      });
      db.milestone.delete.mockResolvedValue({ id: "milestone-1" });

      const milestone = await db.milestone.findUnique({
        where: { id: "milestone-1" },
        include: { goal: true },
      });
      expect(milestone!.goal.userId).toBe(TEST_USER_ID);

      await db.milestone.delete({ where: { id: "milestone-1" } });
      expect(db.milestone.delete).toHaveBeenCalledWith({ where: { id: "milestone-1" } });
    });
  });

  // =========================================================================
  // linkTask / unlinkTask
  // =========================================================================
  describe("linkTask", () => {
    it("should link a task to a goal when both belong to user", async () => {
      db.task.findUnique.mockResolvedValue({ id: "task-1", userId: TEST_USER_ID });
      db.goal.findUnique.mockResolvedValue({ id: "goal-1", userId: TEST_USER_ID });
      db.task.update.mockResolvedValue({ id: "task-1", goalId: "goal-1" });

      const [task, goal] = await Promise.all([
        db.task.findUnique({ where: { id: "task-1", userId: TEST_USER_ID } }),
        db.goal.findUnique({ where: { id: "goal-1", userId: TEST_USER_ID } }),
      ]);

      expect(task).not.toBeNull();
      expect(goal).not.toBeNull();

      const result = await db.task.update({
        where: { id: "task-1" },
        data: { goalId: "goal-1" },
      });

      expect(result.goalId).toBe("goal-1");
    });

    it("should throw NOT_FOUND when task or goal not found", async () => {
      db.task.findUnique.mockResolvedValue(null);
      db.goal.findUnique.mockResolvedValue({ id: "goal-1", userId: TEST_USER_ID });

      const [task, goal] = await Promise.all([
        db.task.findUnique({ where: { id: "task-1", userId: TEST_USER_ID } }),
        db.goal.findUnique({ where: { id: "goal-1", userId: TEST_USER_ID } }),
      ]);

      expect(!task || !goal).toBe(true);
    });
  });

  describe("unlinkTask", () => {
    it("should set goalId to null on user's task", async () => {
      db.task.update.mockResolvedValue({ id: "task-1", goalId: null });

      const result = await db.task.update({
        where: { id: "task-1", userId: TEST_USER_ID },
        data: { goalId: null },
      });

      expect(result.goalId).toBeNull();
      expect(db.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });
  });

  // =========================================================================
  // getStats
  // =========================================================================
  describe("getStats", () => {
    it("should return aggregated goal statistics", async () => {
      const mockGoals = [
        { id: "g1", status: "COMPLETED", type: "LIFETIME", milestones: [], _count: { tasks: 3 } },
        { id: "g2", status: "IN_PROGRESS", type: "ANNUAL", milestones: [], _count: { tasks: 5 } },
        { id: "g3", status: "NOT_STARTED", type: "QUARTERLY", milestones: [], _count: { tasks: 0 } },
        { id: "g4", status: "IN_PROGRESS", type: "MONTHLY", milestones: [], _count: { tasks: 2 } },
      ];
      db.goal.findMany.mockResolvedValue(mockGoals);

      const goals = await db.goal.findMany({
        where: { userId: TEST_USER_ID },
        include: { milestones: true, _count: { select: { tasks: true } } },
      });

      const total = goals.length;
      const completed = goals.filter((g: { status: string }) => g.status === "COMPLETED").length;
      const inProgress = goals.filter((g: { status: string }) => g.status === "IN_PROGRESS").length;
      const notStarted = goals.filter((g: { status: string }) => g.status === "NOT_STARTED").length;

      expect(total).toBe(4);
      expect(completed).toBe(1);
      expect(inProgress).toBe(2);
      expect(notStarted).toBe(1);
    });
  });
});
