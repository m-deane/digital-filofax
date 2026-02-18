import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const exportRouter = createTRPCRouter({
  exportAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [
      tasks,
      categories,
      contexts,
      habits,
      habitLogs,
      memos,
      tags,
      ideas,
      calendarEvents,
      githubRepos,
      preferences,
      contacts,
      contactCategories,
      gratitudeEntries,
      moodEntries,
      lifeRoles,
      weeklyBigRocks,
      somedayItems,
      goals,
      milestones,
      visionBoards,
      visionItems,
      templates,
      transactions,
      financeCategories,
      savingsGoals,
      dailyReflections,
      monthlyReflections,
      weeklyReviews,
      yearlyGoals,
      yearlyThemes,
      yearlyReflections,
      focusSessions,
    ] = await Promise.all([
      ctx.db.task.findMany({
        where: { userId },
        include: {
          category: true,
          context: true,
          tags: true,
          subtasks: { orderBy: { order: "asc" } },
          goal: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.category.findMany({
        where: { userId },
        orderBy: { order: "asc" },
      }),
      ctx.db.context.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      ctx.db.habit.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.habitLog.findMany({
        where: { userId },
        include: { habit: true },
        orderBy: { date: "desc" },
      }),
      ctx.db.memo.findMany({
        where: { userId },
        include: { tags: true },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.tag.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      ctx.db.idea.findMany({
        where: { userId },
        include: { category: true, tags: true },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.calendarEvent.findMany({
        where: { userId },
        orderBy: { startDate: "desc" },
      }),
      ctx.db.gitHubRepo.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.userPreferences.findUnique({
        where: { userId },
      }),
      ctx.db.contact.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { name: "asc" },
      }),
      ctx.db.contactCategory.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      ctx.db.gratitudeEntry.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      }),
      ctx.db.moodEntry.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      }),
      ctx.db.lifeRole.findMany({
        where: { userId },
        orderBy: { order: "asc" },
      }),
      ctx.db.weeklyBigRock.findMany({
        where: { userId },
        include: { role: true },
        orderBy: { weekOf: "desc" },
      }),
      ctx.db.somedayItem.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.goal.findMany({
        where: { userId },
        include: { category: true, milestones: true },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.milestone.findMany({
        where: { goal: { userId } },
        include: { goal: true },
        orderBy: { date: "asc" },
      }),
      ctx.db.visionBoard.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.visionItem.findMany({
        where: { board: { userId } },
        include: { board: true },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.template.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.transaction.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { date: "desc" },
      }),
      ctx.db.financeCategory.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      ctx.db.savingsGoal.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.dailyReflection.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      }),
      ctx.db.monthlyReflection.findMany({
        where: { userId },
        orderBy: { monthOf: "desc" },
      }),
      ctx.db.weeklyReview.findMany({
        where: { userId },
        orderBy: { weekOf: "desc" },
      }),
      ctx.db.yearlyGoal.findMany({
        where: { userId },
        orderBy: { year: "desc" },
      }),
      ctx.db.yearlyTheme.findMany({
        where: { userId },
        orderBy: { year: "desc" },
      }),
      ctx.db.yearlyReflection.findMany({
        where: { userId },
        orderBy: { year: "desc" },
      }),
      ctx.db.focusSession.findMany({
        where: { userId },
        include: { task: true },
        orderBy: { startTime: "desc" },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      userId,
      tasks,
      categories,
      contexts,
      habits,
      habitLogs,
      memos,
      tags,
      ideas,
      calendarEvents,
      githubRepos,
      preferences,
      contacts,
      contactCategories,
      gratitudeEntries,
      moodEntries,
      lifeRoles,
      weeklyBigRocks,
      somedayItems,
      goals,
      milestones,
      visionBoards,
      visionItems,
      templates,
      transactions,
      financeCategories,
      savingsGoals,
      dailyReflections,
      monthlyReflections,
      weeklyReviews,
      yearlyGoals,
      yearlyThemes,
      yearlyReflections,
      focusSessions,
    };
  }),

  exportTasks: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await ctx.db.task.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        category: true,
        context: true,
        tags: true,
        subtasks: { orderBy: { order: "asc" } },
        goal: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return tasks;
  }),

  exportHabits: protectedProcedure.query(async ({ ctx }) => {
    const habits = await ctx.db.habit.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        category: true,
        logs: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return habits;
  }),

  exportMemos: protectedProcedure.query(async ({ ctx }) => {
    const memos = await ctx.db.memo.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        tags: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return memos;
  }),

  exportIdeas: protectedProcedure.query(async ({ ctx }) => {
    const ideas = await ctx.db.idea.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        category: true,
        tags: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return ideas;
  }),

  exportContacts: protectedProcedure.query(async ({ ctx }) => {
    const contacts = await ctx.db.contact.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    });

    return contacts;
  }),

  exportGoals: protectedProcedure.query(async ({ ctx }) => {
    const goals = await ctx.db.goal.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        category: true,
        milestones: { orderBy: { date: "asc" } },
        tasks: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return goals;
  }),

  exportFinance: protectedProcedure.query(async ({ ctx }) => {
    const [transactions, categories, savingsGoals] = await Promise.all([
      ctx.db.transaction.findMany({
        where: { userId: ctx.session.user.id },
        include: { category: true },
        orderBy: { date: "desc" },
      }),
      ctx.db.financeCategory.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { name: "asc" },
      }),
      ctx.db.savingsGoal.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      transactions,
      categories,
      savingsGoals,
    };
  }),

  exportJournal: protectedProcedure.query(async ({ ctx }) => {
    const [gratitude, mood, dailyReflections, monthlyReflections] = await Promise.all([
      ctx.db.gratitudeEntry.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { date: "desc" },
      }),
      ctx.db.moodEntry.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { date: "desc" },
      }),
      ctx.db.dailyReflection.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { date: "desc" },
      }),
      ctx.db.monthlyReflection.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { monthOf: "desc" },
      }),
    ]);

    return {
      gratitudeEntries: gratitude,
      moodEntries: mood,
      dailyReflections,
      monthlyReflections,
    };
  }),
});
