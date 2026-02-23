/**
 * Shared test helpers for mocking tRPC context and Prisma client.
 */
import { vi } from "vitest";

// Standard test user
export const TEST_USER_ID = "test-user-id-123";
export const TEST_USER_EMAIL = "test@example.com";
export const OTHER_USER_ID = "other-user-id-456";

/**
 * Create a mock Prisma client with all models stubbed.
 * Each model has the standard Prisma methods as vi.fn() stubs.
 */
export function createMockPrismaClient() {
  const createModelMock = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "new-id", ...data })),
    update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "updated-id", ...data })),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    delete: vi.fn().mockResolvedValue({ id: "deleted-id" }),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    upsert: vi.fn().mockResolvedValue({ id: "upserted-id" }),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({ _max: { order: 0 } }),
  });

  return {
    task: createModelMock(),
    subtask: createModelMock(),
    category: createModelMock(),
    habit: createModelMock(),
    habitLog: createModelMock(),
    memo: createModelMock(),
    tag: createModelMock(),
    idea: createModelMock(),
    calendarEvent: createModelMock(),
    goal: createModelMock(),
    milestone: createModelMock(),
    user: createModelMock(),
    sharedList: createModelMock(),
    sharedListMember: createModelMock(),
    sharedTask: createModelMock(),
    listInvite: createModelMock(),
    contact: createModelMock(),
    contactCategory: createModelMock(),
    dailyReflection: createModelMock(),
    monthlyReflection: createModelMock(),
    transaction: createModelMock(),
    financeCategory: createModelMock(),
    savingsGoal: createModelMock(),
    focusSession: createModelMock(),
    visionBoard: createModelMock(),
    visionItem: createModelMock(),
    inboxItem: createModelMock(),
    project: createModelMock(),
    $transaction: vi.fn().mockImplementation((promises: Promise<unknown>[]) => Promise.all(promises)),
  };
}

export type MockPrismaClient = ReturnType<typeof createMockPrismaClient>;

/**
 * Create a mock tRPC context with a session containing the test user.
 */
export function createMockContext(overrides?: { userId?: string; email?: string }) {
  const db = createMockPrismaClient();
  return {
    db,
    session: {
      user: {
        id: overrides?.userId ?? TEST_USER_ID,
        email: overrides?.email ?? TEST_USER_EMAIL,
        name: "Test User",
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    },
  };
}

/**
 * Create a mock context with no session (unauthenticated).
 */
export function createUnauthenticatedContext() {
  const db = createMockPrismaClient();
  return {
    db,
    session: null,
  };
}
