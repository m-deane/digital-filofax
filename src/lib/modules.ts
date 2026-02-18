import {
  CheckSquare,
  Target,
  FileText,
  Lightbulb,
  Calendar,
  Trophy,
  Users,
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
};

// Default enabled modules for new users
export const DEFAULT_ENABLED_MODULES: ModuleId[] = [
  "tasks",
  "habits",
  "memos",
  "ideas",
  "calendar",
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

// Get module config by route
export function getModuleByRoute(route: string): ModuleConfig | null {
  for (const config of Object.values(MODULES)) {
    if (config.routes.some((r) => route.startsWith(r))) {
      return config;
    }
  }
  return null;
}

// Get all routes that should be visible based on enabled modules
export function getEnabledRoutes(enabledModules: string[]): string[] {
  const routes: string[] = ["/dashboard", "/dashboard/settings"];

  for (const [moduleId, config] of Object.entries(MODULES)) {
    if (enabledModules.includes(moduleId)) {
      routes.push(...config.routes);
    }
  }

  return routes;
}
