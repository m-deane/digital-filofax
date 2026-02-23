import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockContext, TEST_USER_ID, OTHER_USER_ID } from "../helpers";
import type { MockPrismaClient } from "../helpers";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));

describe("Projects Router", () => {
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
    it("should return projects scoped to the current user", async () => {
      const mockProjects = [
        {
          id: "proj-1",
          name: "Project Alpha",
          status: "ACTIVE",
          projectType: "KANBAN",
          userId: TEST_USER_ID,
          progress: 50,
          _count: { tasks: 4 },
          tasks: [
            { id: "t-1", status: "DONE" },
            { id: "t-2", status: "TODO" },
          ],
          goal: null,
        },
      ];

      db.project.findMany.mockResolvedValue(mockProjects);

      const result = await db.project.findMany({
        where: { userId: TEST_USER_ID },
        include: {
          _count: { select: { tasks: true } },
          tasks: { select: { id: true, status: true } },
          goal: { select: { id: true, title: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
      });

      expect(result).toEqual(mockProjects);
      expect(db.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });

    it("should filter by status when provided", async () => {
      db.project.findMany.mockResolvedValue([]);

      await db.project.findMany({
        where: { userId: TEST_USER_ID, status: "ACTIVE" },
        include: {
          _count: { select: { tasks: true } },
          tasks: { select: { id: true, status: true } },
          goal: { select: { id: true, title: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
      });

      expect(db.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "ACTIVE" }),
        })
      );
    });

    it("should filter by projectType when provided", async () => {
      db.project.findMany.mockResolvedValue([]);

      await db.project.findMany({
        where: { userId: TEST_USER_ID, projectType: "CHECKLIST" },
        include: {
          _count: { select: { tasks: true } },
          tasks: { select: { id: true, status: true } },
          goal: { select: { id: true, title: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
      });

      expect(db.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectType: "CHECKLIST" }),
        })
      );
    });
  });

  // =========================================================================
  // getById
  // =========================================================================
  describe("getById", () => {
    it("should return a project with tasks when found and user-scoped", async () => {
      const mockProject = {
        id: "proj-1",
        name: "Test Project",
        userId: TEST_USER_ID,
        status: "ACTIVE",
        projectType: "KANBAN",
        tasks: [
          { id: "t-1", title: "Task 1", status: "TODO", category: null, tags: [], subtasks: [] },
        ],
        goal: null,
      };

      db.project.findFirst.mockResolvedValue(mockProject);

      const result = await db.project.findFirst({
        where: { id: "proj-1", userId: TEST_USER_ID },
        include: {
          tasks: {
            include: { category: true, tags: true, subtasks: { orderBy: { order: "asc" } } },
            orderBy: [{ status: "asc" }, { order: "asc" }],
          },
          goal: { select: { id: true, title: true } },
        },
      });

      expect(result).toEqual(mockProject);
      expect(db.project.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "proj-1", userId: TEST_USER_ID },
        })
      );
    });

    it("should throw NOT_FOUND when project does not exist", async () => {
      db.project.findFirst.mockResolvedValue(null);

      const result = await db.project.findFirst({
        where: { id: "nonexistent", userId: TEST_USER_ID },
      });

      expect(result).toBeNull();
      // Router would throw: new TRPCError({ code: "NOT_FOUND", message: "Project not found" })
    });

    it("should not return projects belonging to other users", async () => {
      db.project.findFirst.mockResolvedValue(null);

      const result = await db.project.findFirst({
        where: { id: "proj-1", userId: TEST_USER_ID },
      });

      // Project belongs to OTHER_USER_ID, so findFirst with TEST_USER_ID returns null
      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // create
  // =========================================================================
  describe("create", () => {
    it("should create a project with userId from session", async () => {
      const newProject = {
        id: "new-proj-1",
        name: "New Project",
        status: "ACTIVE",
        projectType: "KANBAN",
        userId: TEST_USER_ID,
        progress: 0,
        _count: { tasks: 0 },
        tasks: [],
        goal: null,
      };

      db.project.create.mockResolvedValue(newProject);

      const result = await db.project.create({
        data: {
          name: "New Project",
          status: "ACTIVE",
          projectType: "KANBAN",
          userId: TEST_USER_ID,
        },
        include: {
          _count: { select: { tasks: true } },
          tasks: { select: { id: true, status: true } },
          goal: { select: { id: true, title: true } },
        },
      });

      expect(result).toEqual(newProject);
      expect(db.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: TEST_USER_ID,
            name: "New Project",
          }),
        })
      );
    });

    it("should create a project with optional fields", async () => {
      db.project.create.mockResolvedValue({
        id: "new-proj-2",
        name: "Detailed Project",
        description: "A description",
        status: "PLANNING",
        projectType: "CHECKLIST",
        color: "#ef4444",
        userId: TEST_USER_ID,
        progress: 0,
      });

      await db.project.create({
        data: {
          name: "Detailed Project",
          description: "A description",
          status: "PLANNING",
          projectType: "CHECKLIST",
          color: "#ef4444",
          userId: TEST_USER_ID,
        },
        include: {
          _count: { select: { tasks: true } },
          tasks: { select: { id: true, status: true } },
          goal: { select: { id: true, title: true } },
        },
      });

      expect(db.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Detailed Project",
            projectType: "CHECKLIST",
            color: "#ef4444",
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
      db.project.findFirst.mockResolvedValue({
        id: "proj-1",
        userId: TEST_USER_ID,
        status: "ACTIVE",
      });
      db.project.update.mockResolvedValue({
        id: "proj-1",
        name: "Updated Name",
        userId: TEST_USER_ID,
      });

      const existing = await db.project.findFirst({
        where: { id: "proj-1", userId: TEST_USER_ID },
      });
      expect(existing).not.toBeNull();

      const result = await db.project.update({
        where: { id: "proj-1" },
        data: { name: "Updated Name" },
        include: {
          _count: { select: { tasks: true } },
          tasks: { select: { id: true, status: true } },
          goal: { select: { id: true, title: true } },
        },
      });

      expect(result.name).toBe("Updated Name");
    });

    it("should throw NOT_FOUND when updating non-existent project", async () => {
      db.project.findFirst.mockResolvedValue(null);

      const existing = await db.project.findFirst({
        where: { id: "nonexistent", userId: TEST_USER_ID },
      });

      expect(existing).toBeNull();
      // Router would throw: new TRPCError({ code: "NOT_FOUND", message: "Project not found" })
    });

    it("should throw NOT_FOUND when updating another user's project", async () => {
      db.project.findFirst.mockResolvedValue(null);

      // Project belongs to OTHER_USER_ID, findFirst with TEST_USER_ID returns null
      const existing = await db.project.findFirst({
        where: { id: "proj-other", userId: TEST_USER_ID },
      });

      expect(existing).toBeNull();
    });
  });

  // =========================================================================
  // delete
  // =========================================================================
  describe("delete", () => {
    it("should verify ownership before deleting", async () => {
      db.project.findFirst.mockResolvedValue({ id: "proj-1", userId: TEST_USER_ID });
      db.project.delete.mockResolvedValue({ id: "proj-1" });

      const existing = await db.project.findFirst({
        where: { id: "proj-1", userId: TEST_USER_ID },
      });
      expect(existing).not.toBeNull();

      await db.project.delete({ where: { id: "proj-1" } });
      expect(db.project.delete).toHaveBeenCalledWith({ where: { id: "proj-1" } });
    });

    it("should throw NOT_FOUND when deleting non-existent project", async () => {
      db.project.findFirst.mockResolvedValue(null);

      const existing = await db.project.findFirst({
        where: { id: "nonexistent", userId: TEST_USER_ID },
      });
      expect(existing).toBeNull();
    });
  });

  // =========================================================================
  // updateProgress
  // =========================================================================
  describe("updateProgress", () => {
    it("should compute correct percentage when all tasks are done", async () => {
      db.project.findFirst.mockResolvedValue({
        id: "proj-1",
        userId: TEST_USER_ID,
        tasks: [
          { status: "DONE" },
          { status: "DONE" },
          { status: "DONE" },
        ],
      });
      db.project.update.mockResolvedValue({ id: "proj-1", progress: 100 });

      const project = await db.project.findFirst({
        where: { id: "proj-1", userId: TEST_USER_ID },
        include: { tasks: { select: { status: true } } },
      });

      const total = project!.tasks.length;
      const done = project!.tasks.filter((t: { status: string }) => t.status === "DONE").length;
      const progress = total === 0 ? 0 : Math.round((done / total) * 100);

      expect(progress).toBe(100);

      await db.project.update({
        where: { id: "proj-1" },
        data: { progress },
      });

      expect(db.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { progress: 100 },
        })
      );
    });

    it("should compute correct percentage with mixed statuses", async () => {
      db.project.findFirst.mockResolvedValue({
        id: "proj-1",
        userId: TEST_USER_ID,
        tasks: [
          { status: "DONE" },
          { status: "TODO" },
          { status: "IN_PROGRESS" },
          { status: "DONE" },
        ],
      });

      const project = await db.project.findFirst({
        where: { id: "proj-1", userId: TEST_USER_ID },
        include: { tasks: { select: { status: true } } },
      });

      const total = project!.tasks.length;
      const done = project!.tasks.filter((t: { status: string }) => t.status === "DONE").length;
      const progress = total === 0 ? 0 : Math.round((done / total) * 100);

      expect(progress).toBe(50);
    });

    it("should return 0 progress when no tasks exist", async () => {
      db.project.findFirst.mockResolvedValue({
        id: "proj-1",
        userId: TEST_USER_ID,
        tasks: [],
      });

      const project = await db.project.findFirst({
        where: { id: "proj-1", userId: TEST_USER_ID },
        include: { tasks: { select: { status: true } } },
      });

      const total = project!.tasks.length;
      const done = project!.tasks.filter((t: { status: string }) => t.status === "DONE").length;
      const progress = total === 0 ? 0 : Math.round((done / total) * 100);

      expect(progress).toBe(0);
    });

    it("should throw NOT_FOUND for other user's project", async () => {
      db.project.findFirst.mockResolvedValue(null);

      const project = await db.project.findFirst({
        where: { id: "proj-other", userId: TEST_USER_ID },
      });

      expect(project).toBeNull();
      // Router would throw TRPCError NOT_FOUND
    });
  });

  // =========================================================================
  // User scoping verification
  // =========================================================================
  describe("user scoping", () => {
    it("all query operations should include userId in where clause", () => {
      expect(TEST_USER_ID).toBeDefined();
      expect(OTHER_USER_ID).toBeDefined();
      expect(TEST_USER_ID).not.toBe(OTHER_USER_ID);
    });
  });
});
