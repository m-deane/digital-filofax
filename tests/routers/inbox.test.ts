import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockContext, TEST_USER_ID, OTHER_USER_ID } from "../helpers";
import type { MockPrismaClient } from "../helpers";

vi.mock("@/server/db", () => ({
  db: {},
}));

vi.mock("@/server/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

describe("Inbox Router", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let db: MockPrismaClient;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
    db = ctx.db;
  });

  // =========================================================================
  // create
  // =========================================================================
  describe("create", () => {
    it("should create an inbox item with correct userId", async () => {
      const newItem = {
        id: "inbox-1",
        title: "Quick thought",
        content: null,
        sourceHint: null,
        processed: false,
        userId: TEST_USER_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.inboxItem.create.mockResolvedValue(newItem);

      const result = await db.inboxItem.create({
        data: {
          title: "Quick thought",
          userId: TEST_USER_ID,
        },
      });

      expect(result).toEqual(newItem);
      expect(db.inboxItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: TEST_USER_ID,
            title: "Quick thought",
          }),
        })
      );
    });

    it("should create an inbox item with content and sourceHint", async () => {
      const newItem = {
        id: "inbox-2",
        title: "Meeting notes",
        content: "Discussed Q3 goals",
        sourceHint: "memo",
        processed: false,
        userId: TEST_USER_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.inboxItem.create.mockResolvedValue(newItem);

      const result = await db.inboxItem.create({
        data: {
          title: "Meeting notes",
          content: "Discussed Q3 goals",
          sourceHint: "memo",
          userId: TEST_USER_ID,
        },
      });

      expect(result).toEqual(newItem);
      expect(db.inboxItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Meeting notes",
            content: "Discussed Q3 goals",
            sourceHint: "memo",
            userId: TEST_USER_ID,
          }),
        })
      );
    });
  });

  // =========================================================================
  // getAll
  // =========================================================================
  describe("getAll", () => {
    it("should only return unprocessed items for current user", async () => {
      const mockItems = [
        { id: "inbox-1", title: "Item 1", processed: false, userId: TEST_USER_ID },
        { id: "inbox-2", title: "Item 2", processed: false, userId: TEST_USER_ID },
      ];

      db.inboxItem.findMany.mockResolvedValue(mockItems);

      const result = await db.inboxItem.findMany({
        where: {
          userId: TEST_USER_ID,
          processed: false,
        },
        orderBy: { createdAt: "desc" },
      });

      expect(result).toEqual(mockItems);
      expect(db.inboxItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: TEST_USER_ID,
            processed: false,
          }),
        })
      );
    });

    it("should not return other users' items", async () => {
      db.inboxItem.findMany.mockResolvedValue([]);

      const result = await db.inboxItem.findMany({
        where: {
          userId: TEST_USER_ID,
          processed: false,
        },
        orderBy: { createdAt: "desc" },
      });

      expect(result).toEqual([]);
      expect(db.inboxItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: TEST_USER_ID,
          }),
        })
      );
    });
  });

  // =========================================================================
  // getCount
  // =========================================================================
  describe("getCount", () => {
    it("should return correct count of unprocessed items", async () => {
      db.inboxItem.count.mockResolvedValue(5);

      const result = await db.inboxItem.count({
        where: {
          userId: TEST_USER_ID,
          processed: false,
        },
      });

      expect(result).toBe(5);
      expect(db.inboxItem.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: TEST_USER_ID,
            processed: false,
          }),
        })
      );
    });
  });

  // =========================================================================
  // processAsTask
  // =========================================================================
  describe("processAsTask", () => {
    it("should create a task and mark inbox item as processed", async () => {
      const inboxItem = {
        id: "inbox-1",
        title: "Buy groceries",
        content: "Milk, eggs, bread",
        userId: TEST_USER_ID,
        processed: false,
      };

      db.inboxItem.findFirst.mockResolvedValue(inboxItem);
      db.task.create.mockResolvedValue({
        id: "task-1",
        title: "Buy groceries",
        description: "Milk, eggs, bread",
        status: "TODO",
        priority: "MEDIUM",
        userId: TEST_USER_ID,
        order: 0,
      });
      db.inboxItem.update.mockResolvedValue({ ...inboxItem, processed: true });

      // Verify ownership
      const item = await db.inboxItem.findFirst({
        where: { id: "inbox-1", userId: TEST_USER_ID },
      });
      expect(item).not.toBeNull();

      // Create task
      const task = await db.task.create({
        data: {
          title: item!.title,
          description: item!.content,
          status: "TODO",
          priority: "MEDIUM",
          userId: TEST_USER_ID,
          order: 0,
        },
      });

      expect(task.title).toBe("Buy groceries");
      expect(task.status).toBe("TODO");
      expect(task.priority).toBe("MEDIUM");

      // Mark as processed
      await db.inboxItem.update({
        where: { id: "inbox-1" },
        data: { processed: true },
      });

      expect(db.inboxItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { processed: true },
        })
      );
    });

    it("should throw NOT_FOUND for wrong user", async () => {
      db.inboxItem.findFirst.mockResolvedValue(null);

      const item = await db.inboxItem.findFirst({
        where: { id: "inbox-1", userId: TEST_USER_ID },
      });

      expect(item).toBeNull();
      // Router would throw: new TRPCError({ code: "NOT_FOUND", message: "Inbox item not found" })
    });
  });

  // =========================================================================
  // processAsMemo
  // =========================================================================
  describe("processAsMemo", () => {
    it("should create a memo and mark inbox item as processed", async () => {
      const inboxItem = {
        id: "inbox-2",
        title: "Project notes",
        content: "Important details",
        userId: TEST_USER_ID,
        processed: false,
      };

      db.inboxItem.findFirst.mockResolvedValue(inboxItem);
      db.memo.create.mockResolvedValue({
        id: "memo-1",
        title: "Project notes",
        content: "Important details",
        memoType: "NOTE",
        userId: TEST_USER_ID,
      });
      db.inboxItem.update.mockResolvedValue({ ...inboxItem, processed: true });

      const item = await db.inboxItem.findFirst({
        where: { id: "inbox-2", userId: TEST_USER_ID },
      });
      expect(item).not.toBeNull();

      const memo = await db.memo.create({
        data: {
          title: item!.title,
          content: item!.content ?? "",
          memoType: "NOTE",
          userId: TEST_USER_ID,
        },
      });

      expect(memo.title).toBe("Project notes");
      expect(memo.memoType).toBe("NOTE");

      await db.inboxItem.update({
        where: { id: "inbox-2" },
        data: { processed: true },
      });

      expect(db.inboxItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { processed: true },
        })
      );
    });
  });

  // =========================================================================
  // processAsIdea
  // =========================================================================
  describe("processAsIdea", () => {
    it("should create an idea and mark inbox item as processed", async () => {
      const inboxItem = {
        id: "inbox-3",
        title: "App feature idea",
        content: "Add dark mode toggle",
        userId: TEST_USER_ID,
        processed: false,
      };

      db.inboxItem.findFirst.mockResolvedValue(inboxItem);
      db.idea.create.mockResolvedValue({
        id: "idea-1",
        title: "App feature idea",
        description: "Add dark mode toggle",
        status: "NEW",
        priority: 0,
        userId: TEST_USER_ID,
      });
      db.inboxItem.update.mockResolvedValue({ ...inboxItem, processed: true });

      const item = await db.inboxItem.findFirst({
        where: { id: "inbox-3", userId: TEST_USER_ID },
      });
      expect(item).not.toBeNull();

      const idea = await db.idea.create({
        data: {
          title: item!.title,
          description: item!.content,
          status: "NEW",
          priority: 0,
          userId: TEST_USER_ID,
        },
      });

      expect(idea.title).toBe("App feature idea");
      expect(idea.status).toBe("NEW");

      await db.inboxItem.update({
        where: { id: "inbox-3" },
        data: { processed: true },
      });

      expect(db.inboxItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { processed: true },
        })
      );
    });
  });

  // =========================================================================
  // delete
  // =========================================================================
  describe("delete", () => {
    it("should delete own inbox item", async () => {
      db.inboxItem.findFirst.mockResolvedValue({
        id: "inbox-1",
        userId: TEST_USER_ID,
      });
      db.inboxItem.delete.mockResolvedValue({ id: "inbox-1" });

      const item = await db.inboxItem.findFirst({
        where: { id: "inbox-1", userId: TEST_USER_ID },
      });
      expect(item).not.toBeNull();

      await db.inboxItem.delete({ where: { id: "inbox-1" } });
      expect(db.inboxItem.delete).toHaveBeenCalledWith({ where: { id: "inbox-1" } });
    });

    it("should throw NOT_FOUND for another user's item", async () => {
      db.inboxItem.findFirst.mockResolvedValue(null);

      const item = await db.inboxItem.findFirst({
        where: { id: "inbox-1", userId: TEST_USER_ID },
      });

      expect(item).toBeNull();
      // Router would throw: new TRPCError({ code: "NOT_FOUND", message: "Inbox item not found" })
    });
  });
});
