import { describe, it, expect, vi } from "vitest";

// Mock lucide-react icons to avoid React component issues in Node environment
vi.mock("lucide-react", () => {
  const icon = () => null;
  return {
    CheckSquare: icon,
    Target: icon,
    FileText: icon,
    Lightbulb: icon,
    Calendar: icon,
    Trophy: icon,
    Users: icon,
    DollarSign: icon,
    CloudOff: icon,
    Heart: icon,
    Compass: icon,
    Github: icon,
    Share2: icon,
    BarChart3: icon,
    Sparkles: icon,
    LayoutTemplate: icon,
    Image: icon,
    FolderKanban: icon,
  };
});

import {
  MODULE_IDS,
  MODULES,
  DEFAULT_ENABLED_MODULES,
  isRouteEnabled,
  isWidgetEnabled,
} from "@/lib/modules";

describe("Modules Configuration", () => {
  // =========================================================================
  // MODULE_IDS & MODULES
  // =========================================================================
  describe("MODULE_IDS and MODULES", () => {
    it("should have all expected module IDs", () => {
      expect(MODULE_IDS).toContain("tasks");
      expect(MODULE_IDS).toContain("habits");
      expect(MODULE_IDS).toContain("memos");
      expect(MODULE_IDS).toContain("ideas");
      expect(MODULE_IDS).toContain("calendar");
      expect(MODULE_IDS).toContain("goals");
      expect(MODULE_IDS).toContain("contacts");
      expect(MODULE_IDS).toContain("finance");
      expect(MODULE_IDS).toContain("someday");
      expect(MODULE_IDS).toContain("journal");
      expect(MODULE_IDS).toContain("planning");
      expect(MODULE_IDS).toContain("github");
      expect(MODULE_IDS).toContain("collaboration");
    });

    it("should have a MODULES entry for every MODULE_ID", () => {
      for (const id of MODULE_IDS) {
        expect(MODULES[id]).toBeDefined();
        expect(MODULES[id].id).toBe(id);
        expect(MODULES[id].name).toBeTruthy();
        expect(MODULES[id].description).toBeTruthy();
        expect(MODULES[id].routes).toBeDefined();
        expect(Array.isArray(MODULES[id].routes)).toBe(true);
        expect(MODULES[id].widgets).toBeDefined();
        expect(Array.isArray(MODULES[id].widgets)).toBe(true);
      }
    });

    it("should have non-empty routes for each module", () => {
      for (const id of MODULE_IDS) {
        expect(MODULES[id].routes.length).toBeGreaterThan(0);
      }
    });

    it("should have icon for each module", () => {
      for (const id of MODULE_IDS) {
        expect(MODULES[id].icon).toBeDefined();
      }
    });
  });

  // =========================================================================
  // DEFAULT_ENABLED_MODULES
  // =========================================================================
  describe("DEFAULT_ENABLED_MODULES", () => {
    it("should include core modules", () => {
      expect(DEFAULT_ENABLED_MODULES).toContain("tasks");
      expect(DEFAULT_ENABLED_MODULES).toContain("habits");
      expect(DEFAULT_ENABLED_MODULES).toContain("calendar");
    });

    it("should only contain valid module IDs", () => {
      for (const id of DEFAULT_ENABLED_MODULES) {
        expect(MODULE_IDS).toContain(id);
      }
    });

    it("should have a reasonable default set size", () => {
      expect(DEFAULT_ENABLED_MODULES.length).toBeGreaterThanOrEqual(3);
      expect(DEFAULT_ENABLED_MODULES.length).toBeLessThanOrEqual(MODULE_IDS.length);
    });
  });

  // =========================================================================
  // isRouteEnabled
  // =========================================================================
  describe("isRouteEnabled", () => {
    it("should always enable the dashboard root", () => {
      expect(isRouteEnabled("/dashboard", [])).toBe(true);
      expect(isRouteEnabled("/dashboard", ["tasks"])).toBe(true);
    });

    it("should always enable settings routes", () => {
      expect(isRouteEnabled("/dashboard/settings", [])).toBe(true);
      expect(isRouteEnabled("/dashboard/settings/modules", [])).toBe(true);
    });

    it("should enable tasks routes when tasks module is enabled", () => {
      expect(isRouteEnabled("/dashboard/tasks", ["tasks"])).toBe(true);
      expect(isRouteEnabled("/dashboard/weekly", ["tasks"])).toBe(true);
    });

    it("should disable tasks routes when tasks module is not enabled", () => {
      expect(isRouteEnabled("/dashboard/tasks", ["habits"])).toBe(false);
      expect(isRouteEnabled("/dashboard/weekly", ["habits"])).toBe(false);
    });

    it("should enable habits routes when habits module is enabled", () => {
      expect(isRouteEnabled("/dashboard/habits", ["habits"])).toBe(true);
    });

    it("should disable habits routes when habits module is not enabled", () => {
      expect(isRouteEnabled("/dashboard/habits", ["tasks"])).toBe(false);
    });

    it("should enable calendar routes when calendar module is enabled", () => {
      expect(isRouteEnabled("/dashboard/daily", ["calendar"])).toBe(true);
      expect(isRouteEnabled("/dashboard/planner/weekly", ["calendar"])).toBe(true);
    });

    it("should handle unknown routes as enabled", () => {
      expect(isRouteEnabled("/dashboard/unknown-page", [])).toBe(true);
    });

    it("should handle multiple enabled modules", () => {
      const enabled = ["tasks", "habits", "goals"];
      expect(isRouteEnabled("/dashboard/tasks", enabled)).toBe(true);
      expect(isRouteEnabled("/dashboard/habits", enabled)).toBe(true);
      expect(isRouteEnabled("/dashboard/goals", enabled)).toBe(true);
      expect(isRouteEnabled("/dashboard/finance", enabled)).toBe(false);
    });

    it("should enable all module routes when all modules enabled", () => {
      const allModules = [...MODULE_IDS] as string[];
      for (const id of MODULE_IDS) {
        for (const route of MODULES[id].routes) {
          expect(isRouteEnabled(route, allModules)).toBe(true);
        }
      }
    });
  });

  // =========================================================================
  // isWidgetEnabled
  // =========================================================================
  describe("isWidgetEnabled", () => {
    it("should enable widgets for enabled modules", () => {
      expect(isWidgetEnabled("tasks", ["tasks"])).toBe(true);
      expect(isWidgetEnabled("habits", ["habits"])).toBe(true);
      expect(isWidgetEnabled("goals", ["goals"])).toBe(true);
    });

    it("should disable widgets for disabled modules", () => {
      expect(isWidgetEnabled("tasks", ["habits"])).toBe(false);
      expect(isWidgetEnabled("habits", ["tasks"])).toBe(false);
    });

    it("should handle unknown widget types as enabled", () => {
      expect(isWidgetEnabled("unknown-widget", [])).toBe(true);
    });

    it("should enable calendar-related widgets when calendar module is on", () => {
      expect(isWidgetEnabled("agenda", ["calendar"])).toBe(true);
      expect(isWidgetEnabled("focus", ["calendar"])).toBe(true);
    });

    it("should disable calendar widgets when calendar module is off", () => {
      expect(isWidgetEnabled("agenda", ["tasks"])).toBe(false);
      expect(isWidgetEnabled("calendar", ["tasks"])).toBe(false);
    });
  });
});
