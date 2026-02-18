import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const visionItemTypeSchema = z.enum(["IMAGE", "TEXT", "GOAL", "AFFIRMATION"]);

export const visionRouter = createTRPCRouter({
  // Board operations
  getBoards: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.visionBoard.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        items: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }),

  getBoard: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.visionBoard.findUnique({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }),

  getDefaultBoard: protectedProcedure.query(async ({ ctx }) => {
    const defaultBoard = await ctx.db.visionBoard.findFirst({
      where: {
        userId: ctx.session.user.id,
        isDefault: true,
      },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (defaultBoard) return defaultBoard;

    // If no default board exists, return the first board or null
    return ctx.db.visionBoard.findFirst({
      where: { userId: ctx.session.user.id },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  createBoard: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        year: z.number().optional(),
        isDefault: z.boolean().optional(),
        bgColor: z.string().max(50).optional(),
        bgImage: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // If setting as default, unset other defaults
      if (input.isDefault) {
        await ctx.db.visionBoard.updateMany({
          where: {
            userId: ctx.session.user.id,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      return ctx.db.visionBoard.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
        include: {
          items: true,
        },
      });
    }),

  updateBoard: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        year: z.number().nullable().optional(),
        isDefault: z.boolean().optional(),
        bgColor: z.string().max(50).optional(),
        bgImage: z.string().max(2000).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await ctx.db.visionBoard.updateMany({
          where: {
            userId: ctx.session.user.id,
            isDefault: true,
            NOT: { id },
          },
          data: { isDefault: false },
        });
      }

      return ctx.db.visionBoard.update({
        where: {
          id,
          userId: ctx.session.user.id,
        },
        data,
        include: {
          items: true,
        },
      });
    }),

  deleteBoard: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.visionBoard.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });
    }),

  setDefaultBoard: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Unset all defaults
      await ctx.db.visionBoard.updateMany({
        where: {
          userId: ctx.session.user.id,
          isDefault: true,
        },
        data: { isDefault: false },
      });

      // Set new default
      return ctx.db.visionBoard.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: { isDefault: true },
      });
    }),

  // Item operations
  getItems: protectedProcedure
    .input(z.object({ boardId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify board belongs to user
      const board = await ctx.db.visionBoard.findUnique({
        where: { id: input.boardId, userId: ctx.session.user.id },
      });

      if (!board) throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });

      return ctx.db.visionItem.findMany({
        where: { boardId: input.boardId },
        orderBy: { createdAt: "asc" },
      });
    }),

  createItem: protectedProcedure
    .input(
      z.object({
        boardId: z.string(),
        type: visionItemTypeSchema,
        content: z.string().min(1).max(10000),
        position: z.object({ x: z.number(), y: z.number() }),
        size: z.object({ width: z.number(), height: z.number() }),
        color: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify board belongs to user
      const board = await ctx.db.visionBoard.findUnique({
        where: { id: input.boardId, userId: ctx.session.user.id },
      });

      if (!board) throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });

      return ctx.db.visionItem.create({
        data: {
          boardId: input.boardId,
          type: input.type,
          content: input.content,
          position: input.position,
          size: input.size,
          color: input.color,
        },
      });
    }),

  updateItem: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        type: visionItemTypeSchema.optional(),
        content: z.string().min(1).max(10000).optional(),
        position: z.object({ x: z.number(), y: z.number() }).optional(),
        size: z.object({ width: z.number(), height: z.number() }).optional(),
        color: z.string().max(50).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify ownership through board
      const item = await ctx.db.visionItem.findUnique({
        where: { id },
        include: { board: true },
      });
      if (!item || item.board.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }

      return ctx.db.visionItem.update({
        where: { id },
        data,
      });
    }),

  updatePosition: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        position: z.object({ x: z.number(), y: z.number() }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through board
      const item = await ctx.db.visionItem.findUnique({
        where: { id: input.id },
        include: { board: true },
      });
      if (!item || item.board.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }

      return ctx.db.visionItem.update({
        where: { id: input.id },
        data: { position: input.position },
      });
    }),

  updateSize: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        size: z.object({ width: z.number(), height: z.number() }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through board
      const item = await ctx.db.visionItem.findUnique({
        where: { id: input.id },
        include: { board: true },
      });
      if (!item || item.board.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }

      return ctx.db.visionItem.update({
        where: { id: input.id },
        data: { size: input.size },
      });
    }),

  deleteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through board
      const item = await ctx.db.visionItem.findUnique({
        where: { id: input.id },
        include: { board: true },
      });
      if (!item || item.board.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }

      return ctx.db.visionItem.delete({
        where: { id: input.id },
      });
    }),

  // Get random inspiration (for dashboard widget)
  getRandomInspiration: protectedProcedure.query(async ({ ctx }) => {
    const defaultBoard = await ctx.db.visionBoard.findFirst({
      where: {
        userId: ctx.session.user.id,
        isDefault: true,
      },
      include: {
        items: {
          where: {
            type: { in: ["AFFIRMATION", "TEXT"] },
          },
        },
      },
    });

    if (!defaultBoard || defaultBoard.items.length === 0) {
      return null;
    }

    // Return a random item
    const randomIndex = Math.floor(Math.random() * defaultBoard.items.length);
    return defaultBoard.items[randomIndex];
  }),

  // Upload image as base64
  uploadImage: protectedProcedure
    .input(
      z.object({
        boardId: z.string(),
        base64: z.string().max(5_000_000), // ~3.75MB image limit
        position: z.object({ x: z.number(), y: z.number() }),
        size: z.object({ width: z.number(), height: z.number() }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify board belongs to user
      const board = await ctx.db.visionBoard.findUnique({
        where: { id: input.boardId, userId: ctx.session.user.id },
      });

      if (!board) throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });

      // Store base64 directly as content
      // In a production app, you'd upload to S3/Cloudinary and store the URL
      return ctx.db.visionItem.create({
        data: {
          boardId: input.boardId,
          type: "IMAGE",
          content: input.base64,
          position: input.position,
          size: input.size,
        },
      });
    }),
});
