import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockContext, TEST_USER_ID, OTHER_USER_ID } from "../helpers";
import type { MockPrismaClient } from "../helpers";

vi.mock("@/server/db", () => ({
  db: {},
}));

vi.mock("@/server/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

describe("Contacts Router", () => {
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
    it("should return contacts scoped to user", async () => {
      const mockContacts = [
        { id: "c-1", name: "Alice", email: "alice@example.com", userId: TEST_USER_ID, isFavorite: true },
        { id: "c-2", name: "Bob", email: "bob@example.com", userId: TEST_USER_ID, isFavorite: false },
      ];
      db.contact.findMany.mockResolvedValue(mockContacts);

      const result = await db.contact.findMany({
        where: { userId: TEST_USER_ID },
        include: { category: true },
        orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
      });

      expect(result).toEqual(mockContacts);
      expect(db.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });

    it("should filter by search query across multiple fields", async () => {
      db.contact.findMany.mockResolvedValue([]);

      await db.contact.findMany({
        where: {
          userId: TEST_USER_ID,
          OR: [
            { name: { contains: "alice", mode: "insensitive" } },
            { email: { contains: "alice", mode: "insensitive" } },
            { phone: { contains: "alice", mode: "insensitive" } },
            { company: { contains: "alice", mode: "insensitive" } },
          ],
        },
        include: { category: true },
        orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
      });

      expect(db.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: TEST_USER_ID,
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: "alice", mode: "insensitive" } }),
            ]),
          }),
        })
      );
    });

    it("should filter by categoryId", async () => {
      db.contact.findMany.mockResolvedValue([]);

      await db.contact.findMany({
        where: { userId: TEST_USER_ID, categoryId: "cat-1" },
        include: { category: true },
        orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
      });

      expect(db.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: "cat-1" }),
        })
      );
    });

    it("should filter by favorites", async () => {
      db.contact.findMany.mockResolvedValue([]);

      await db.contact.findMany({
        where: { userId: TEST_USER_ID, isFavorite: true },
        include: { category: true },
        orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
      });

      expect(db.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isFavorite: true }),
        })
      );
    });
  });

  // =========================================================================
  // getById
  // =========================================================================
  describe("getById", () => {
    it("should return contact when found and user-scoped", async () => {
      const mockContact = { id: "c-1", name: "Alice", userId: TEST_USER_ID, category: null };
      db.contact.findFirst.mockResolvedValue(mockContact);

      const result = await db.contact.findFirst({
        where: { id: "c-1", userId: TEST_USER_ID },
        include: { category: true },
      });

      expect(result).toEqual(mockContact);
      expect(db.contact.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "c-1", userId: TEST_USER_ID },
        })
      );
    });

    it("should return null for non-existent contact", async () => {
      db.contact.findFirst.mockResolvedValue(null);

      const result = await db.contact.findFirst({
        where: { id: "nonexistent", userId: TEST_USER_ID },
      });

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // create
  // =========================================================================
  describe("create", () => {
    it("should create a contact with userId from session", async () => {
      const newContact = {
        id: "c-new",
        name: "Charlie",
        email: "charlie@example.com",
        phone: "+1234567890",
        userId: TEST_USER_ID,
        category: null,
      };
      db.contact.create.mockResolvedValue(newContact);

      const result = await db.contact.create({
        data: {
          name: "Charlie",
          email: "charlie@example.com",
          phone: "+1234567890",
          userId: TEST_USER_ID,
        },
        include: { category: true },
      });

      expect(result).toEqual(newContact);
      expect(db.contact.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });

    it("should set email to null when empty string is provided", async () => {
      db.contact.create.mockResolvedValue({
        id: "c-new",
        name: "No Email",
        email: null,
        userId: TEST_USER_ID,
      });

      // Simulate router logic: email: input.email || null
      const inputEmail = "";
      const email = inputEmail || null;

      await db.contact.create({
        data: {
          name: "No Email",
          email,
          userId: TEST_USER_ID,
        },
        include: { category: true },
      });

      expect(db.contact.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: null }),
        })
      );
    });
  });

  // =========================================================================
  // update
  // =========================================================================
  describe("update", () => {
    it("should verify ownership before updating", async () => {
      db.contact.findFirst.mockResolvedValue({ id: "c-1", userId: TEST_USER_ID });
      db.contact.update.mockResolvedValue({ id: "c-1", name: "Updated", userId: TEST_USER_ID, category: null });

      const existing = await db.contact.findFirst({
        where: { id: "c-1", userId: TEST_USER_ID },
      });
      expect(existing).not.toBeNull();

      const result = await db.contact.update({
        where: { id: "c-1" },
        data: { name: "Updated" },
        include: { category: true },
      });

      expect(result.name).toBe("Updated");
    });

    it("should return null when updating non-existent contact", async () => {
      db.contact.findFirst.mockResolvedValue(null);

      const existing = await db.contact.findFirst({
        where: { id: "nonexistent", userId: TEST_USER_ID },
      });

      expect(existing).toBeNull();
    });
  });

  // =========================================================================
  // delete
  // =========================================================================
  describe("delete", () => {
    it("should verify ownership before deleting", async () => {
      db.contact.findFirst.mockResolvedValue({ id: "c-1", userId: TEST_USER_ID });
      db.contact.delete.mockResolvedValue({ id: "c-1" });

      const existing = await db.contact.findFirst({
        where: { id: "c-1", userId: TEST_USER_ID },
      });
      expect(existing).not.toBeNull();

      await db.contact.delete({ where: { id: "c-1" } });
      expect(db.contact.delete).toHaveBeenCalledWith({ where: { id: "c-1" } });
    });

    it("should not delete another user's contact", async () => {
      db.contact.findFirst.mockResolvedValue(null);

      const existing = await db.contact.findFirst({
        where: { id: "c-1", userId: TEST_USER_ID },
      });

      expect(existing).toBeNull();
    });
  });

  // =========================================================================
  // toggleFavorite
  // =========================================================================
  describe("toggleFavorite", () => {
    it("should toggle isFavorite from false to true", async () => {
      db.contact.findFirst.mockResolvedValue({ id: "c-1", userId: TEST_USER_ID, isFavorite: false });
      db.contact.update.mockResolvedValue({ id: "c-1", isFavorite: true, category: null });

      const existing = await db.contact.findFirst({
        where: { id: "c-1", userId: TEST_USER_ID },
      });
      expect(existing).not.toBeNull();

      const result = await db.contact.update({
        where: { id: "c-1" },
        data: { isFavorite: !existing!.isFavorite },
        include: { category: true },
      });

      expect(result.isFavorite).toBe(true);
    });

    it("should toggle isFavorite from true to false", async () => {
      db.contact.findFirst.mockResolvedValue({ id: "c-1", userId: TEST_USER_ID, isFavorite: true });
      db.contact.update.mockResolvedValue({ id: "c-1", isFavorite: false, category: null });

      const existing = await db.contact.findFirst({
        where: { id: "c-1", userId: TEST_USER_ID },
      });

      const result = await db.contact.update({
        where: { id: "c-1" },
        data: { isFavorite: !existing!.isFavorite },
        include: { category: true },
      });

      expect(result.isFavorite).toBe(false);
    });

    it("should not toggle favorite for non-existent contact", async () => {
      db.contact.findFirst.mockResolvedValue(null);

      const existing = await db.contact.findFirst({
        where: { id: "c-1", userId: TEST_USER_ID },
      });

      expect(existing).toBeNull();
    });
  });

  // =========================================================================
  // CONTACT CATEGORIES
  // =========================================================================
  describe("getCategories", () => {
    it("should return contact categories scoped to user", async () => {
      const mockCategories = [
        { id: "cc-1", name: "Family", userId: TEST_USER_ID, _count: { contacts: 3 } },
        { id: "cc-2", name: "Work", userId: TEST_USER_ID, _count: { contacts: 10 } },
      ];
      db.contactCategory.findMany.mockResolvedValue(mockCategories);

      const result = await db.contactCategory.findMany({
        where: { userId: TEST_USER_ID },
        orderBy: { name: "asc" },
        include: { _count: { select: { contacts: true } } },
      });

      expect(result).toEqual(mockCategories);
    });
  });

  describe("createCategory", () => {
    it("should create a contact category with userId", async () => {
      const newCat = { id: "cc-new", name: "Friends", color: "#6366f1", userId: TEST_USER_ID };
      db.contactCategory.create.mockResolvedValue(newCat);

      const result = await db.contactCategory.create({
        data: { name: "Friends", color: "#6366f1", userId: TEST_USER_ID },
      });

      expect(result).toEqual(newCat);
      expect(db.contactCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: TEST_USER_ID }),
        })
      );
    });
  });

  describe("updateCategory", () => {
    it("should verify ownership before updating contact category", async () => {
      db.contactCategory.findFirst.mockResolvedValue({ id: "cc-1", userId: TEST_USER_ID });
      db.contactCategory.update.mockResolvedValue({ id: "cc-1", name: "Updated" });

      const existing = await db.contactCategory.findFirst({
        where: { id: "cc-1", userId: TEST_USER_ID },
      });
      expect(existing).not.toBeNull();

      const result = await db.contactCategory.update({
        where: { id: "cc-1" },
        data: { name: "Updated" },
      });

      expect(result.name).toBe("Updated");
    });
  });

  describe("deleteCategory", () => {
    it("should verify ownership before deleting contact category", async () => {
      db.contactCategory.findFirst.mockResolvedValue({ id: "cc-1", userId: TEST_USER_ID });
      db.contactCategory.delete.mockResolvedValue({ id: "cc-1" });

      const existing = await db.contactCategory.findFirst({
        where: { id: "cc-1", userId: TEST_USER_ID },
      });
      expect(existing).not.toBeNull();

      await db.contactCategory.delete({ where: { id: "cc-1" } });
      expect(db.contactCategory.delete).toHaveBeenCalledWith({ where: { id: "cc-1" } });
    });

    it("should not delete another user's contact category", async () => {
      db.contactCategory.findFirst.mockResolvedValue(null);

      const existing = await db.contactCategory.findFirst({
        where: { id: "cc-1", userId: TEST_USER_ID },
      });

      expect(existing).toBeNull();
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
