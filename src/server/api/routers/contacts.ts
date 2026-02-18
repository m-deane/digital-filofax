import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const contactsRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        categoryId: z.string().optional(),
        isFavorite: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const contacts = await ctx.db.contact.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.search && {
            OR: [
              { name: { contains: input.search, mode: "insensitive" } },
              { email: { contains: input.search, mode: "insensitive" } },
              { phone: { contains: input.search, mode: "insensitive" } },
              { company: { contains: input.search, mode: "insensitive" } },
            ],
          }),
          ...(input?.categoryId && { categoryId: input.categoryId }),
          ...(input?.isFavorite !== undefined && { isFavorite: input.isFavorite }),
        },
        include: {
          category: true,
        },
        orderBy: [
          { isFavorite: "desc" },
          { name: "asc" },
        ],
      });

      return contacts;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const contact = await ctx.db.contact.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          category: true,
        },
      });

      if (!contact) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
      }

      return contact;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().max(50).optional(),
        address: z.string().max(500).optional(),
        company: z.string().max(200).optional(),
        jobTitle: z.string().max(200).optional(),
        birthday: z.date().optional(),
        notes: z.string().optional(),
        isFavorite: z.boolean().default(false),
        categoryId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const contact = await ctx.db.contact.create({
        data: {
          ...input,
          email: input.email || null,
          userId: ctx.session.user.id,
        },
        include: {
          category: true,
        },
      });

      return contact;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().max(50).optional(),
        address: z.string().max(500).optional(),
        company: z.string().max(200).optional(),
        jobTitle: z.string().max(200).optional(),
        birthday: z.date().nullable().optional(),
        notes: z.string().optional(),
        isFavorite: z.boolean().optional(),
        categoryId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, email, ...updateData } = input;

      const existing = await ctx.db.contact.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
      }

      const contact = await ctx.db.contact.update({
        where: { id },
        data: {
          ...updateData,
          ...(email !== undefined && { email: email || null }),
        },
        include: {
          category: true,
        },
      });

      return contact;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.contact.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
      }

      await ctx.db.contact.delete({ where: { id: input.id } });

      return { success: true };
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.contact.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
      }

      const contact = await ctx.db.contact.update({
        where: { id: input.id },
        data: { isFavorite: !existing.isFavorite },
        include: {
          category: true,
        },
      });

      return contact;
    }),

  // Category operations
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.contactCategory.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });
  }),

  createCategory: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        color: z.string().default("#6366f1"),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.contactCategory.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });

      return category;
    }),

  updateCategory: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const existing = await ctx.db.contactCategory.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }

      return ctx.db.contactCategory.update({
        where: { id },
        data: updateData,
      });
    }),

  deleteCategory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.contactCategory.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }

      await ctx.db.contactCategory.delete({ where: { id: input.id } });

      return { success: true };
    }),
});
