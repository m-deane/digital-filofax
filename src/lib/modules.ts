import {
  CheckSquare,
  Target,
  FileText,
  Lightbulb,
  Calendar,
  Trophy,
  Users,
  DollarSign,
  CloudOff,
  Heart,
  Compass,
  Github,
  Share2,
  BarChart3,
  Sparkles,
  LayoutTemplate,
  Image,
  FolderKanban,
  type LucideIcon,
} from "lucide-react";

// Module identifiers
export const MODULE_IDS = [
  "tasks",
  "habits",
  "memos",
  "ideas",
  "calendar",
  "goals",
  "contacts",
  "finance",
  "someday",
  "journal",
  "planning",
  "github",
  "collaboration",
  "analytics",
  "suggestions",
  "templates",
  "vision",
  "projects",
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

// Module configuration
export interface ModuleConfig {
  id: ModuleId;
  name: string;
  description: string;
  icon: LucideIcon;
  routes: string[];
  widgets: string[];
  isCore?: boolean; // Core modules cannot be disabled
}

export const MODULES: Record<ModuleId, ModuleConfig> = {
  tasks: {
    id: "tasks",
    name: "Tasks",
    description: "Track and manage your to-do items with priorities and due dates",
    icon: CheckSquare,
    routes: ["/dashboard/tasks", "/dashboard/weekly", "/dashboard/monthly"],
    widgets: ["tasks"],
  },
  habits: {
    id: "habits",
    name: "Habits",
    description: "Build consistent daily habits with streak tracking",
    icon: Target,
    routes: ["/dashboard/habits"],
    widgets: ["habits", "streaks"],
  },
  memos: {
    id: "memos",
    name: "Memos",
    description: "Capture notes, thoughts, and quick ideas",
    icon: FileText,
    routes: ["/dashboard/memos"],
    widgets: ["quick-capture"],
  },
  ideas: {
    id: "ideas",
    name: "Ideas",
    description: "Track and develop ideas through a kanban workflow",
    icon: Lightbulb,
    routes: ["/dashboard/ideas"],
    widgets: ["ideas"],
  },
  calendar: {
    id: "calendar",
    name: "Calendar",
    description: "Schedule events and plan your time",
    icon: Calendar,
    routes: ["/dashboard/planner/weekly", "/dashboard/planner/monthly", "/dashboard/daily"],
    widgets: ["agenda", "calendar", "focus"],
  },
  goals: {
    id: "goals",
    name: "Goals",
    description: "Set and track long-term goals with milestones",
    icon: Trophy,
    routes: ["/dashboard/goals"],
    widgets: ["goals"],
  },
  contacts: {
    id: "contacts",
    name: "Contacts",
    description: "Manage your personal and professional contacts",
    icon: Users,
    routes: ["/dashboard/contacts"],
    widgets: [],
  },
  finance: {
    id: "finance",
    name: "Finance",
    description: "Track income, expenses, budgets, and savings goals",
    icon: DollarSign,
    routes: ["/dashboard/finance", "/dashboard/finance/transactions"],
    widgets: ["finance"],
  },
  someday: {
    id: "someday",
    name: "Someday/Maybe",
    description: "GTD-style list for ideas and projects you might do someday",
    icon: CloudOff,
    routes: ["/dashboard/someday"],
    widgets: ["someday-review"],
  },
  journal: {
    id: "journal",
    name: "Journal",
    description: "Daily gratitude and mood tracking for wellbeing",
    icon: Heart,
    routes: ["/dashboard/journal"],
    widgets: ["journal"],
  },
  planning: {
    id: "planning",
    name: "Planning & Reviews",
    description: "Life roles, weekly reviews, yearly overview and reflections",
    icon: Compass,
    routes: ["/dashboard/roles", "/dashboard/review", "/dashboard/yearly", "/dashboard/reflect"],
    widgets: ["weekly-review"],
  },
  github: {
    id: "github",
    name: "GitHub",
    description: "Connect and track GitHub repositories, issues, and pull requests",
    icon: Github,
    routes: ["/dashboard/github"],
    widgets: ["github"],
  },
  collaboration: {
    id: "collaboration",
    name: "Collaboration",
    description: "Share tasks and collaborate with others through shared lists",
    icon: Share2,
    routes: ["/dashboard/shared"],
    widgets: [],
  },
  analytics: {
    id: "analytics",
    name: "Analytics",
    description: "Productivity charts, habit stats, and goal progress insights",
    icon: BarChart3,
    routes: ["/dashboard/analytics"],
    widgets: [],
  },
  suggestions: {
    id: "suggestions",
    name: "Smart Suggestions",
    description: "Rule-based suggestions for task prioritization and scheduling",
    icon: Sparkles,
    routes: ["/dashboard/suggestions"],
    widgets: [],
  },
  templates: {
    id: "templates",
    name: "Templates",
    description: "Reusable templates for tasks, projects, and routines",
    icon: LayoutTemplate,
    routes: ["/dashboard/templates"],
    widgets: [],
  },
  vision: {
    id: "vision",
    name: "Vision Board",
    description: "Visual inspiration board for goals and aspirations",
    icon: Image,
    routes: ["/dashboard/vision"],
    widgets: [],
  },
  projects: {
    id: "projects",
    name: "Projects",
    description: "Organize work into Kanban boards and checklists",
    icon: FolderKanban,
    routes: ["/dashboard/projects"],
    widgets: [],
  },
};

// Default enabled modules for new users
export const DEFAULT_ENABLED_MODULES: ModuleId[] = [
  "tasks",
  "habits",
  "memos",
  "ideas",
  "calendar",
  "projects",
];

// Check if a route is enabled based on enabled modules
export function isRouteEnabled(route: string, enabledModules: string[]): boolean {
  // Dashboard and settings are always enabled
  if (route === "/dashboard" || route.startsWith("/dashboard/settings")) {
    return true;
  }

  // Find which module this route belongs to
  for (const [moduleId, config] of Object.entries(MODULES)) {
    if (config.routes.some((r) => route.startsWith(r))) {
      return enabledModules.includes(moduleId);
    }
  }

  // Unknown routes are enabled by default
  return true;
}

// Check if a widget should be shown based on enabled modules
export function isWidgetEnabled(widgetType: string, enabledModules: string[]): boolean {
  for (const [moduleId, config] of Object.entries(MODULES)) {
    if (config.widgets.includes(widgetType)) {
      return enabledModules.includes(moduleId);
    }
  }
  // Unknown widgets are enabled by default
  return true;
}

