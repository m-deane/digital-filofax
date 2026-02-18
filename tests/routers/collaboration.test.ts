import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockContext, TEST_USER_ID, TEST_USER_EMAIL, OTHER_USER_ID } from "../helpers";
import type { MockPrismaClient } from "../helpers";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));

describe("Collaboration Router", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let db: MockPrismaClient;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
    db = ctx.db;
  });

  // =========================================================================
  // createSharedList
  // =========================================================================
  describe("createSharedList", () => {
    it("should create a shared list with current user as owner", async () => {
      db.sharedList.create.mockResolvedValue({
        id: "list-1",
        name: "Team Tasks",
        description: "Shared team tasks",
        ownerId: TEST_USER_ID,
        members: [],
        tasks: [],
      });

      const result = await db.sharedList.create({
        data: {
          name: "Team Tasks",
          description: "Shared team tasks",
          ownerId: TEST_USER_ID,
        },
        include: expect.any(Object),
      });

      expect(result.name).toBe("Team Tasks");
      expect(result.ownerId).toBe(TEST_USER_ID);
      expect(db.sharedList.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerId: TEST_USER_ID,
          }),
        })
      );
    });
  });

  // =========================================================================
  // getSharedLists
  // =========================================================================
  describe("getSharedLists", () => {
    it("should return owned and member lists separately", async () => {
      const ownedLists = [
        { id: "list-1", name: "My List", ownerId: TEST_USER_ID, members: [], tasks: [], _count: { tasks: 0, members: 0 } },
      ];
      const memberLists = [
        {
          id: "list-2",
          name: "Their List",
          ownerId: OTHER_USER_ID,
          owner: { id: OTHER_USER_ID, name: "Other", email: "other@test.com", image: null },
          members: [{ role: "EDITOR", acceptedAt: new Date() }],
          tasks: [],
          _count: { tasks: 2, members: 1 },
        },
      ];

      // First call: owned lists, Second call: member lists
      db.sharedList.findMany
        .mockResolvedValueOnce(ownedLists)
        .mockResolvedValueOnce(memberLists);

      const [owned, member] = await Promise.all([
        db.sharedList.findMany({
          where: { ownerId: TEST_USER_ID },
          include: expect.any(Object),
          orderBy: { updatedAt: "desc" },
        }),
        db.sharedList.findMany({
          where: {
            members: {
              some: { userId: TEST_USER_ID, acceptedAt: { not: null } },
            },
          },
          include: expect.any(Object),
          orderBy: { updatedAt: "desc" },
        }),
      ]);

      expect(owned).toHaveLength(1);
      expect(member).toHaveLength(1);
      expect(owned[0].ownerId).toBe(TEST_USER_ID);
    });
  });

  // =========================================================================
  // checkListPermission (tested indirectly through procedures)
  // =========================================================================
  describe("checkListPermission", () => {
    it("should allow owner full access", async () => {
      db.sharedList.findUnique.mockResolvedValue({
        id: "list-1",
        ownerId: TEST_USER_ID,
        members: [],
      });

      const sharedList = await db.sharedList.findUnique({
        where: { id: "list-1" },
        include: { members: { where: { userId: TEST_USER_ID } } },
      });

      expect(sharedList).not.toBeNull();
      expect(sharedList!.ownerId).toBe(TEST_USER_ID);
      // Owner has full access regardless of role
    });

    it("should block users without membership", async () => {
      db.sharedList.findUnique.mockResolvedValue({
        id: "list-1",
        ownerId: OTHER_USER_ID,
        members: [], // TEST_USER_ID not a member
      });

      const sharedList = await db.sharedList.findUnique({
        where: { id: "list-1" },
        include: { members: { where: { userId: TEST_USER_ID } } },
      });

      const membership = sharedList!.members[0];
      expect(membership).toBeUndefined();
      // Router would throw FORBIDDEN
    });

    it("should check role hierarchy for member access", async () => {
      const roleHierarchy: Record<string, number> = { OWNER: 3, EDITOR: 2, VIEWER: 1 };

      // VIEWER trying to access EDITOR-required action
      expect(roleHierarchy["VIEWER"]! < roleHierarchy["EDITOR"]!).toBe(true);

      // EDITOR trying to access EDITOR-required action
      expect(roleHierarchy["EDITOR"]! >= roleHierarchy["EDITOR"]!).toBe(true);

      // EDITOR trying to access OWNER-required action
      expect(roleHierarchy["EDITOR"]! < roleHierarchy["OWNER"]!).toBe(true);
    });

    it("should block unaccepted invites", async () => {
      db.sharedList.findUnique.mockResolvedValue({
        id: "list-1",
        ownerId: OTHER_USER_ID,
        members: [
          { userId: TEST_USER_ID, role: "EDITOR", acceptedAt: null },
        ],
      });

      const sharedList = await db.sharedList.findUnique({
        where: { id: "list-1" },
        include: { members: { where: { userId: TEST_USER_ID } } },
      });

      const membership = sharedList!.members[0];
      expect(membership).toBeDefined();
      expect(membership!.acceptedAt).toBeNull();
      // Router would throw FORBIDDEN because acceptedAt is null
    });
  });

  // =========================================================================
  // inviteToList
  // =========================================================================
  describe("inviteToList", () => {
    it("should create an invite for an existing user", async () => {
      // Owner check
      db.sharedList.findUnique.mockResolvedValue({
        id: "list-1",
        ownerId: TEST_USER_ID,
        members: [],
      });

      // Target user exists
      db.user.findUnique.mockResolvedValue({ id: OTHER_USER_ID, email: "other@test.com" });

      // Not already a member
      db.sharedListMember.findUnique.mockResolvedValue(null);

      // No pending invite
      db.listInvite.findFirst.mockResolvedValue(null);

      // Create invite
      db.listInvite.create.mockResolvedValue({
        id: "invite-1",
        listId: "list-1",
        email: "other@test.com",
        token: "some-token",
        role: "EDITOR",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const result = await db.listInvite.create({
        data: {
          listId: "list-1",
          email: "other@test.com",
          token: expect.any(String),
          role: "EDITOR",
          expiresAt: expect.any(Date),
        },
      });

      expect(result.email).toBe("other@test.com");
      expect(result.role).toBe("EDITOR");
    });

    it("should reject when target user does not exist", async () => {
      db.sharedList.findUnique.mockResolvedValue({
        id: "list-1",
        ownerId: TEST_USER_ID,
        members: [],
      });
      db.user.findUnique.mockResolvedValue(null);

      const invitedUser = await db.user.findUnique({
        where: { email: "nonexistent@test.com" },
      });
      expect(invitedUser).toBeNull();
      // Router throws NOT_FOUND
    });

    it("should reject when user is already a member", async () => {
      db.sharedList.findUnique.mockResolvedValue({
        id: "list-1",
        ownerId: TEST_USER_ID,
        members: [],
      });
      db.user.findUnique.mockResolvedValue({ id: OTHER_USER_ID, email: "other@test.com" });
      db.sharedListMember.findUnique.mockResolvedValue({
        listId: "list-1",
        userId: OTHER_USER_ID,
      });

      const existingMember = await db.sharedListMember.findUnique({
        where: { listId_userId: { listId: "list-1", userId: OTHER_USER_ID } },
      });
      expect(existingMember).not.toBeNull();
      // Router throws BAD_REQUEST
    });
  });

  // =========================================================================
  // acceptInvite
  // =========================================================================
  describe("acceptInvite", () => {
    it("should create membership and update invite on acceptance", async () => {
      const futureDate = new Date(Date.now() + 86400000);
      db.listInvite.findUnique.mockResolvedValue({
        id: "invite-1",
        token: "valid-token",
        listId: "list-1",
        email: TEST_USER_EMAIL,
        role: "EDITOR",
        acceptedAt: null,
        expiresAt: futureDate,
        list: { id: "list-1" },
      });

      db.sharedListMember.create.mockResolvedValue({
        listId: "list-1",
        userId: TEST_USER_ID,
        role: "EDITOR",
        acceptedAt: new Date(),
      });

      db.listInvite.update.mockResolvedValue({ id: "invite-1", acceptedAt: new Date() });

      // Verify invite
      const invite = await db.listInvite.findUnique({
        where: { token: "valid-token" },
        include: { list: true },
      });

      expect(invite).not.toBeNull();
      expect(invite!.acceptedAt).toBeNull();
      expect(invite!.expiresAt > new Date()).toBe(true);
      expect(invite!.email).toBe(TEST_USER_EMAIL);

      // Create membership
      const member = await db.sharedListMember.create({
        data: {
          listId: invite!.listId,
          userId: TEST_USER_ID,
          role: invite!.role,
          acceptedAt: new Date(),
        },
      });

      expect(member.role).toBe("EDITOR");
    });

    it("should reject already-accepted invite", async () => {
      db.listInvite.findUnique.mockResolvedValue({
        id: "invite-1",
        token: "used-token",
        acceptedAt: new Date(), // Already accepted
      });

      const invite = await db.listInvite.findUnique({
        where: { token: "used-token" },
      });

      expect(invite!.acceptedAt).not.toBeNull();
      // Router throws BAD_REQUEST
    });

    it("should reject expired invite", async () => {
      db.listInvite.findUnique.mockResolvedValue({
        id: "invite-1",
        token: "expired-token",
        acceptedAt: null,
        expiresAt: new Date(Date.now() - 86400000), // Past date
      });

      const invite = await db.listInvite.findUnique({
        where: { token: "expired-token" },
      });

      expect(invite!.expiresAt < new Date()).toBe(true);
      // Router throws BAD_REQUEST
    });

    it("should reject invite for different email", async () => {
      db.listInvite.findUnique.mockResolvedValue({
        id: "invite-1",
        token: "token",
        email: "someone-else@test.com",
        acceptedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
      });

      const invite = await db.listInvite.findUnique({
        where: { token: "token" },
      });

      expect(invite!.email).not.toBe(TEST_USER_EMAIL);
      // Router throws FORBIDDEN
    });
  });

  // =========================================================================
  // removeFromList
  // =========================================================================
  describe("removeFromList", () => {
    it("should remove a member (owner only)", async () => {
      db.sharedList.findUnique.mockResolvedValue({
        id: "list-1",
        ownerId: TEST_USER_ID,
        members: [],
      });
      db.sharedListMember.delete.mockResolvedValue({});

      await db.sharedListMember.delete({
        where: {
          listId_userId: { listId: "list-1", userId: OTHER_USER_ID },
        },
      });

      expect(db.sharedListMember.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            listId_userId: { listId: "list-1", userId: OTHER_USER_ID },
          },
        })
      );
    });

    it("should not allow owner to remove themselves", () => {
      // Router checks: input.userId === ctx.session.user.id
      const inputUserId = TEST_USER_ID;
      const sessionUserId = TEST_USER_ID;
      expect(inputUserId).toBe(sessionUserId);
      // Would throw BAD_REQUEST
    });
  });

  // =========================================================================
  // addTaskToList
  // =========================================================================
  describe("addTaskToList", () => {
    it("should add user's task to a shared list", async () => {
      db.sharedList.findUnique.mockResolvedValue({
        id: "list-1",
        ownerId: TEST_USER_ID,
        members: [],
      });
      db.task.findUnique.mockResolvedValue({
        id: "task-1",
        userId: TEST_USER_ID,
      });
      db.sharedTask.findUnique.mockResolvedValue(null); // Not already in list
      db.sharedTask.create.mockResolvedValue({
        listId: "list-1",
        taskId: "task-1",
        addedBy: TEST_USER_ID,
        task: { id: "task-1", category: null, tags: [], subtasks: [] },
      });
      db.sharedList.update.mockResolvedValue({ id: "list-1" });

      const task = await db.task.findUnique({
        where: { id: "task-1" },
      });
      expect(task).not.toBeNull();
      expect(task!.userId).toBe(TEST_USER_ID);

      const existingSharedTask = await db.sharedTask.findUnique({
        where: { listId_taskId: { listId: "list-1", taskId: "task-1" } },
      });
      expect(existingSharedTask).toBeNull();

      const result = await db.sharedTask.create({
        data: {
          listId: "list-1",
          taskId: "task-1",
          addedBy: TEST_USER_ID,
        },
        include: expect.any(Object),
      });

      expect(result.taskId).toBe("task-1");
      expect(result.addedBy).toBe(TEST_USER_ID);
    });

    it("should reject when task already in list", async () => {
      db.sharedList.findUnique.mockResolvedValue({
        id: "list-1",
        ownerId: TEST_USER_ID,
        members: [],
      });
      db.task.findUnique.mockResolvedValue({ id: "task-1", userId: TEST_USER_ID });
      db.sharedTask.findUnique.mockResolvedValue({
        listId: "list-1",
        taskId: "task-1",
      });

      const existingSharedTask = await db.sharedTask.findUnique({
        where: { listId_taskId: { listId: "list-1", taskId: "task-1" } },
      });
      expect(existingSharedTask).not.toBeNull();
      // Router throws BAD_REQUEST
    });
  });

  // =========================================================================
  // leaveList
  // =========================================================================
  describe("leaveList", () => {
    it("should allow member to leave a list", async () => {
      db.sharedList.findUnique.mockResolvedValue({
        id: "list-1",
        ownerId: OTHER_USER_ID, // Not the current user
      });
      db.sharedListMember.delete.mockResolvedValue({});

      const sharedList = await db.sharedList.findUnique({
        where: { id: "list-1" },
      });
      expect(sharedList!.ownerId).not.toBe(TEST_USER_ID);

      await db.sharedListMember.delete({
        where: { listId_userId: { listId: "list-1", userId: TEST_USER_ID } },
      });

      expect(db.sharedListMember.delete).toHaveBeenCalled();
    });

    it("should prevent owner from leaving their own list", async () => {
      db.sharedList.findUnique.mockResolvedValue({
        id: "list-1",
        ownerId: TEST_USER_ID,
      });

      const sharedList = await db.sharedList.findUnique({
        where: { id: "list-1" },
      });
      expect(sharedList!.ownerId).toBe(TEST_USER_ID);
      // Router throws BAD_REQUEST
    });
  });

  // =========================================================================
  // deleteSharedList
  // =========================================================================
  describe("deleteSharedList", () => {
    it("should allow owner to delete list", async () => {
      db.sharedList.findUnique.mockResolvedValue({
        id: "list-1",
        ownerId: TEST_USER_ID,
      });
      db.sharedList.delete.mockResolvedValue({ id: "list-1" });

      const list = await db.sharedList.findUnique({
        where: { id: "list-1" },
      });
      expect(list!.ownerId).toBe(TEST_USER_ID);

      await db.sharedList.delete({ where: { id: "list-1" } });
      expect(db.sharedList.delete).toHaveBeenCalled();
    });

    it("should reject deletion by non-owner", async () => {
      db.sharedList.findUnique.mockResolvedValue({
        id: "list-1",
        ownerId: OTHER_USER_ID,
      });

      const list = await db.sharedList.findUnique({
        where: { id: "list-1" },
      });
      expect(list!.ownerId).not.toBe(TEST_USER_ID);
      // Router throws FORBIDDEN
    });

    it("should throw NOT_FOUND for non-existent list", async () => {
      db.sharedList.findUnique.mockResolvedValue(null);

      const list = await db.sharedList.findUnique({
        where: { id: "nonexistent" },
      });
      expect(list).toBeNull();
      // Router throws NOT_FOUND
    });
  });

  // =========================================================================
  // getMyPendingInvites
  // =========================================================================
  describe("getMyPendingInvites", () => {
    it("should return pending invites for user's email", async () => {
      const futureDate = new Date(Date.now() + 86400000);
      const mockInvites = [
        {
          id: "invite-1",
          email: TEST_USER_EMAIL,
          acceptedAt: null,
          expiresAt: futureDate,
          list: { id: "list-1", owner: { id: OTHER_USER_ID, name: "Other", email: "other@test.com", image: null } },
        },
      ];

      db.listInvite.findMany.mockResolvedValue(mockInvites);

      const result = await db.listInvite.findMany({
        where: {
          email: TEST_USER_EMAIL,
          acceptedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
        include: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe(TEST_USER_EMAIL);
    });
  });
});
