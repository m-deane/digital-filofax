import { describe, it, expect } from "vitest";
import {
  isOverdue,
  isDueToday,
  isDueSoon,
  getDaysUntilDue,
  getUrgencyLevel,
  getUrgencyColor,
  getUrgencyLabel,
  getPriorityIndicator,
  getPriorityColor,
} from "../src/lib/urgency";
import { addDays, subDays } from "date-fns";

describe("Urgency Utilities", () => {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const tomorrow = addDays(today, 1);
  const twoDaysAgo = subDays(today, 2);
  const inTwoDays = addDays(today, 2);
  const inFiveDays = addDays(today, 5);

  describe("isOverdue", () => {
    it("should return true for dates in the past", () => {
      expect(isOverdue(yesterday)).toBe(true);
      expect(isOverdue(twoDaysAgo)).toBe(true);
    });

    it("should return false for today", () => {
      expect(isOverdue(today)).toBe(false);
    });

    it("should return false for future dates", () => {
      expect(isOverdue(tomorrow)).toBe(false);
      expect(isOverdue(inFiveDays)).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isOverdue(null)).toBe(false);
      expect(isOverdue(undefined)).toBe(false);
    });
  });

  describe("isDueToday", () => {
    it("should return true for today", () => {
      expect(isDueToday(today)).toBe(true);
    });

    it("should return false for other dates", () => {
      expect(isDueToday(yesterday)).toBe(false);
      expect(isDueToday(tomorrow)).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isDueToday(null)).toBe(false);
      expect(isDueToday(undefined)).toBe(false);
    });
  });

  describe("isDueSoon", () => {
    it("should return true for dates within 3 days", () => {
      expect(isDueSoon(tomorrow)).toBe(true);
      expect(isDueSoon(inTwoDays)).toBe(true);
    });

    it("should return false for today", () => {
      expect(isDueSoon(today)).toBe(false);
    });

    it("should return false for dates beyond threshold", () => {
      expect(isDueSoon(inFiveDays)).toBe(false);
    });

    it("should return false for past dates", () => {
      expect(isDueSoon(yesterday)).toBe(false);
    });

    it("should support custom days threshold", () => {
      expect(isDueSoon(inFiveDays, 7)).toBe(true);
      expect(isDueSoon(inFiveDays, 3)).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isDueSoon(null)).toBe(false);
      expect(isDueSoon(undefined)).toBe(false);
    });
  });

  describe("getDaysUntilDue", () => {
    it("should return positive number for future dates", () => {
      expect(getDaysUntilDue(tomorrow)).toBe(1);
      expect(getDaysUntilDue(inTwoDays)).toBe(2);
    });

    it("should return 0 for today", () => {
      expect(getDaysUntilDue(today)).toBe(0);
    });

    it("should return negative number for past dates", () => {
      expect(getDaysUntilDue(yesterday)).toBe(-1);
      expect(getDaysUntilDue(twoDaysAgo)).toBe(-2);
    });

    it("should return null for null/undefined", () => {
      expect(getDaysUntilDue(null)).toBe(null);
      expect(getDaysUntilDue(undefined)).toBe(null);
    });
  });

  describe("getUrgencyLevel", () => {
    it("should return critical for overdue tasks", () => {
      expect(
        getUrgencyLevel({ dueDate: yesterday, priority: "MEDIUM", status: "TODO" })
      ).toBe("critical");
    });

    it("should return high for due today tasks", () => {
      expect(
        getUrgencyLevel({ dueDate: today, priority: "MEDIUM", status: "TODO" })
      ).toBe("high");
    });

    it("should return high for URGENT priority", () => {
      expect(
        getUrgencyLevel({ dueDate: inFiveDays, priority: "URGENT", status: "TODO" })
      ).toBe("high");
    });

    it("should return medium for due soon tasks", () => {
      expect(
        getUrgencyLevel({ dueDate: inTwoDays, priority: "MEDIUM", status: "TODO" })
      ).toBe("medium");
    });

    it("should return medium for HIGH priority", () => {
      expect(
        getUrgencyLevel({ dueDate: inFiveDays, priority: "HIGH", status: "TODO" })
      ).toBe("medium");
    });

    it("should return low for tasks with distant due dates", () => {
      expect(
        getUrgencyLevel({ dueDate: inFiveDays, priority: "MEDIUM", status: "TODO" })
      ).toBe("low");
    });

    it("should return none for completed tasks", () => {
      expect(
        getUrgencyLevel({ dueDate: yesterday, priority: "URGENT", status: "DONE" })
      ).toBe("none");
    });

    it("should return none for tasks with no due date and low priority", () => {
      expect(
        getUrgencyLevel({ dueDate: null, priority: "LOW", status: "TODO" })
      ).toBe("none");
    });
  });

  describe("getUrgencyColor", () => {
    it("should return red colors for critical", () => {
      const colors = getUrgencyColor("critical");
      expect(colors.border).toContain("red");
      expect(colors.badge).toContain("red");
    });

    it("should return orange colors for high", () => {
      const colors = getUrgencyColor("high");
      expect(colors.border).toContain("orange");
      expect(colors.badge).toContain("orange");
    });

    it("should return yellow colors for medium", () => {
      const colors = getUrgencyColor("medium");
      expect(colors.border).toContain("yellow");
      expect(colors.badge).toContain("yellow");
    });

    it("should return gray colors for low", () => {
      const colors = getUrgencyColor("low");
      expect(colors.border).toContain("gray");
      expect(colors.badge).toContain("gray");
    });

    it("should return empty strings for none", () => {
      const colors = getUrgencyColor("none");
      expect(colors.bg).toBe("");
      expect(colors.text).toBe("");
    });
  });

  describe("getUrgencyLabel", () => {
    it("should return overdue label for past dates", () => {
      expect(
        getUrgencyLabel({ dueDate: yesterday, priority: "MEDIUM", status: "TODO" })
      ).toBe("Overdue by 1 day");
      expect(
        getUrgencyLabel({ dueDate: twoDaysAgo, priority: "MEDIUM", status: "TODO" })
      ).toBe("Overdue by 2 days");
    });

    it("should return due today label", () => {
      expect(
        getUrgencyLabel({ dueDate: today, priority: "MEDIUM", status: "TODO" })
      ).toBe("Due today");
    });

    it("should return due tomorrow label", () => {
      expect(
        getUrgencyLabel({ dueDate: tomorrow, priority: "MEDIUM", status: "TODO" })
      ).toBe("Due tomorrow");
    });

    it("should return due in X days label", () => {
      expect(
        getUrgencyLabel({ dueDate: inTwoDays, priority: "MEDIUM", status: "TODO" })
      ).toBe("Due in 2 days");
    });

    it("should return null for completed tasks", () => {
      expect(
        getUrgencyLabel({ dueDate: yesterday, priority: "URGENT", status: "DONE" })
      ).toBe(null);
    });

    it("should return null for tasks without due dates", () => {
      expect(
        getUrgencyLabel({ dueDate: null, priority: "MEDIUM", status: "TODO" })
      ).toBe(null);
    });
  });

  describe("getPriorityIndicator", () => {
    it("should return !!! for URGENT", () => {
      expect(getPriorityIndicator("URGENT")).toBe("!!!");
    });

    it("should return !! for HIGH", () => {
      expect(getPriorityIndicator("HIGH")).toBe("!!");
    });

    it("should return ! for MEDIUM", () => {
      expect(getPriorityIndicator("MEDIUM")).toBe("!");
    });

    it("should return empty string for LOW", () => {
      expect(getPriorityIndicator("LOW")).toBe("");
    });

    it("should return empty string for null/undefined", () => {
      expect(getPriorityIndicator(null)).toBe("");
      expect(getPriorityIndicator(undefined)).toBe("");
    });
  });

  describe("getPriorityColor", () => {
    it("should return red for URGENT", () => {
      expect(getPriorityColor("URGENT")).toContain("red");
    });

    it("should return orange for HIGH", () => {
      expect(getPriorityColor("HIGH")).toContain("orange");
    });

    it("should return yellow for MEDIUM", () => {
      expect(getPriorityColor("MEDIUM")).toContain("yellow");
    });

    it("should return gray for LOW", () => {
      expect(getPriorityColor("LOW")).toContain("gray");
    });

    it("should return muted-foreground for null/undefined", () => {
      expect(getPriorityColor(null)).toContain("muted-foreground");
      expect(getPriorityColor(undefined)).toContain("muted-foreground");
    });
  });
});
