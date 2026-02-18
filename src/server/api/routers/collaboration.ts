import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";

const SharedListRoleEnum = z.enum(["OWNER", "EDITOR", "VIEWER"]);

// Helper function to check if user has permission for a specific list
async function checkListPermission(
  db: {
    sharedList: {
      findUnique: (args: {
        where: { id: string };
        include: { members: { where: { userId: string } } };
      }) => Promise<{
        id: string;
        ownerId: string;
        members: { userId: string; role: string; acceptedAt: Date | null }[];
      } | null>;
    };
  },
  listId: string,
  userId: string,
  requiredRole: "OWNER" | "EDITOR" | "VIEWER"
): Promise<{
  id: string;
  ownerId: string;
  members: { userId: string; role: string; acceptedAt: Date | null }[];
}> {
  const sharedList = await db.sharedList.findUnique({
    where: { id: listId },
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!sharedList) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Shared list not found",
    });
  }

  // Owner has full access
  if (sharedList.ownerId === userId) {
    return sharedList;
  }

  const membership = sharedList.members[0];
  if (!membership || !membership.acceptedAt) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this list",
    });
  }

  // Check role permissions
  const roleHierarchy: Record<string, number> = { OWNER: 3, EDITOR: 2, VIEWER: 1 };
  const memberRole = membership.role as "OWNER" | "EDITOR" | "VIEWER";
  if ((roleHierarchy[memberRole] ?? 0) < roleHierarchy[requiredRole]) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You need ${requiredRole} permission for this action`,
    });
  }

  return sharedList;
}

export const collaborationRouter = createTRPCRouter({
  // Create a new shared list
  createSharedList: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.sharedList.create({
        data: {
          name: input.name,
          description: input.description,
          ownerId: ctx.session.user.id,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          tasks: {
            include: {
              task: {
                include: {
                  category: true,
                  tags: true,
                  subtasks: true,
                },
              },
            },
          },
        },
      });
    }),

  // Get all shared lists (owned or member of)
  getSharedLists: protectedProcedure.query(async ({ ctx }) => {
    const [ownedLists, memberLists] = await Promise.all([
      ctx.db.sharedList.findMany({
        where: { ownerId: ctx.session.user.id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          tasks: {
            include: {
              task: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      ctx.db.sharedList.findMany({
        where: {
          members: {
            some: {
              userId: ctx.session.user.id,
              acceptedAt: { not: null },
            },
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          members: {
            where: { userId: ctx.session.user.id },
            select: { role: true, acceptedAt: true },
          },
          tasks: {
            include: {
              task: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return {
      ownedLists,
      memberLists: memberLists.map((list) => ({
        ...list,
        myRole: list.members[0]?.role,
      })),
    };
  }),

  // Get a single shared list by ID
  getSharedListById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      await checkListPermission(ctx.db, input.id, ctx.session.user.id, "VIEWER");

      const list = await ctx.db.sharedList.findUnique({
        where: { id: input.id },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
            orderBy: { invitedAt: "desc" },
          },
          tasks: {
            include: {
              task: {
                include: {
                  category: true,
                  tags: true,
                  subtasks: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      image: true,
                    },
                  },
                },
              },
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: { addedAt: "desc" },
          },
          invites: {
            where: { acceptedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!list) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shared list not found",
        });
      }

      // Determine user's role
      const isOwner = list.ownerId === ctx.session.user.id;
      const membership = list.members.find((m) => m.userId === ctx.session.user.id);
      const myRole = isOwner ? "OWNER" : membership?.role || null;

      return {
        ...list,
        myRole,
      };
    }),

  // Invite someone to a shared list by email
  inviteToList: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        email: z.string().email(),
        role: SharedListRoleEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only owner can invite
      await checkListPermission(
        ctx.db,
        input.listId,
        ctx.session.user.id,
        "OWNER"
      );

      // Check if user exists
      const invitedUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!invitedUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User with this email not found",
        });
      }

      // Check if user is already a member
      const existingMember = await ctx.db.sharedListMember.findUnique({
        where: {
          listId_userId: {
            listId: input.listId,
            userId: invitedUser.id,
          },
        },
      });

      if (existingMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already a member of this list",
        });
      }

      // Check for pending invite
      const pendingInvite = await ctx.db.listInvite.findFirst({
        where: {
          listId: input.listId,
          email: input.email,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (pendingInvite) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An invite is already pending for this email",
        });
      }

      // Generate unique token
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const invite = await ctx.db.listInvite.create({
        data: {
          listId: input.listId,
          email: input.email,
          token,
          role: input.role,
          expiresAt,
        },
      });

      // TODO: Send email notification
      // For now, we'll just return the invite with the token

      return invite;
    }),

  // Accept an invitation
  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.listInvite.findUnique({
        where: { token: input.token },
        include: { list: true },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found",
        });
      }

      if (invite.acceptedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invite has already been accepted",
        });
      }

      if (invite.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invite has expired",
        });
      }

      if (invite.email !== ctx.session.user.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invite is for a different email address",
        });
      }

      // Create membership and update invite
      const [member] = await Promise.all([
        ctx.db.sharedListMember.create({
          data: {
            listId: invite.listId,
            userId: ctx.session.user.id,
            role: invite.role,
            acceptedAt: new Date(),
          },
        }),
        ctx.db.listInvite.update({
          where: { id: invite.id },
          data: { acceptedAt: new Date() },
        }),
      ]);

      return member;
    }),

  // Remove a member from a list (owner only)
  removeFromList: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only owner can remove members
      await checkListPermission(ctx.db, input.listId, ctx.session.user.id, "OWNER");

      // Cannot remove yourself (use leaveList instead)
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Use leaveList to leave a shared list",
        });
      }

      await ctx.db.sharedListMember.delete({
        where: {
          listId_userId: {
            listId: input.listId,
            userId: input.userId,
          },
        },
      });

      return { success: true };
    }),

  // Update a member's role (owner only)
  updateMemberRole: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        userId: z.string(),
        role: SharedListRoleEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only owner can change roles
      await checkListPermission(ctx.db, input.listId, ctx.session.user.id, "OWNER");

      // Cannot change owner's role
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot change owner's role",
        });
      }

      const member = await ctx.db.sharedListMember.update({
        where: {
          listId_userId: {
            listId: input.listId,
            userId: input.userId,
          },
        },
        data: { role: input.role },
      });

      return member;
    }),

  // Add a task to a shared list
  addTaskToList: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        taskId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Editor or owner can add tasks
      await checkListPermission(ctx.db, input.listId, ctx.session.user.id, "EDITOR");

      // Verify task belongs to user
      const task = await ctx.db.task.findUnique({
        where: { id: input.taskId },
      });

      if (!task || task.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found or you don't have access",
        });
      }

      // Check if task is already in the list
      const existingSharedTask = await ctx.db.sharedTask.findUnique({
        where: {
          listId_taskId: {
            listId: input.listId,
            taskId: input.taskId,
          },
        },
      });

      if (existingSharedTask) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Task is already in this list",
        });
      }

      const sharedTask = await ctx.db.sharedTask.create({
        data: {
          listId: input.listId,
          taskId: input.taskId,
          addedBy: ctx.session.user.id,
        },
        include: {
          task: {
            include: {
              category: true,
              tags: true,
              subtasks: true,
            },
          },
        },
      });

      // Update list's updatedAt timestamp
      await ctx.db.sharedList.update({
        where: { id: input.listId },
        data: { updatedAt: new Date() },
      });

      return sharedTask;
    }),

  // Remove a task from a shared list
  removeTaskFromList: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        taskId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Editor or owner can remove tasks
      await checkListPermission(ctx.db, input.listId, ctx.session.user.id, "EDITOR");

      await ctx.db.sharedTask.delete({
        where: {
          listId_taskId: {
            listId: input.listId,
            taskId: input.taskId,
          },
        },
      });

      // Update list's updatedAt timestamp
      await ctx.db.sharedList.update({
        where: { id: input.listId },
        data: { updatedAt: new Date() },
      });

      return { success: true };
    }),

  // Leave a shared list (members only, not owner)
  leaveList: protectedProcedure
    .input(z.object({ listId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const sharedList = await ctx.db.sharedList.findUnique({
        where: { id: input.listId },
      });

      if (!sharedList) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shared list not found",
        });
      }

      if (sharedList.ownerId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Owner cannot leave their own list. Delete it instead.",
        });
      }

      await ctx.db.sharedListMember.delete({
        where: {
          listId_userId: {
            listId: input.listId,
            userId: ctx.session.user.id,
          },
        },
      });

      return { success: true };
    }),

  // Delete a shared list (owner only)
  deleteSharedList: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const list = await ctx.db.sharedList.findUnique({
        where: { id: input.id },
      });

      if (!list) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shared list not found",
        });
      }

      if (list.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can delete this list",
        });
      }

      await ctx.db.sharedList.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Update shared list
  updateSharedList: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only owner can update list details
      await checkListPermission(ctx.db, input.id, ctx.session.user.id, "OWNER");

      const list = await ctx.db.sharedList.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      return list;
    }),

  // Get pending invites for current user
  getMyPendingInvites: protectedProcedure.query(async ({ ctx }) => {
    const invites = await ctx.db.listInvite.findMany({
      where: {
        email: ctx.session.user.email ?? "",
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        list: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return invites;
  }),
});
