import { describe, it, expect } from "vitest";
import {
  getNextDueDate,
  parseRecurrenceRule,
  serializeRecurrenceRule,
} from "@/lib/recurrence";

describe("getNextDueDate", () => {
  describe("daily", () => {
    it("advances by 1 day", () => {
      const result = getNextDueDate(new Date("2026-02-22T00:00:00.000Z"), { frequency: "daily" });
      expect(result.toISOString().slice(0, 10)).toBe("2026-02-23");
    });

    it("crosses a month boundary correctly", () => {
      const result = getNextDueDate(new Date("2026-02-28T00:00:00.000Z"), { frequency: "daily" });
      expect(result.toISOString().slice(0, 10)).toBe("2026-03-01");
    });
  });

  describe("weekly — no daysOfWeek", () => {
    it("advances by exactly 7 days", () => {
      const result = getNextDueDate(new Date("2026-02-22T00:00:00.000Z"), { frequency: "weekly" });
      expect(result.toISOString().slice(0, 10)).toBe("2026-03-01");
    });

    it("advances by 7 days when daysOfWeek is empty array", () => {
      const result = getNextDueDate(new Date("2026-02-22T00:00:00.000Z"), { frequency: "weekly", daysOfWeek: [] });
      expect(result.toISOString().slice(0, 10)).toBe("2026-03-01");
    });
  });

  describe("weekly — with daysOfWeek", () => {
    it("finds the next day in the same week (Mon→Wed)", () => {
      // 2026-02-23 is a Monday (day 1)
      const result = getNextDueDate(new Date("2026-02-23T00:00:00.000Z"), {
        frequency: "weekly",
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      });
      // Next is Wednesday 2026-02-25
      expect(result.toISOString().slice(0, 10)).toBe("2026-02-25");
    });

    it("wraps to next week when current day is the last in the set (Fri→Mon)", () => {
      // 2026-02-27 is a Friday (day 5)
      const result = getNextDueDate(new Date("2026-02-27T00:00:00.000Z"), {
        frequency: "weekly",
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      });
      // Wraps to next Monday 2026-03-02
      expect(result.toISOString().slice(0, 10)).toBe("2026-03-02");
    });

    it("wraps when current day is after all selected days (Wed, only Mon set)", () => {
      // 2026-02-25 is a Wednesday (day 3)
      const result = getNextDueDate(new Date("2026-02-25T00:00:00.000Z"), {
        frequency: "weekly",
        daysOfWeek: [1], // Monday only
      });
      // Next Monday is 2026-03-02
      expect(result.toISOString().slice(0, 10)).toBe("2026-03-02");
    });
  });

  describe("monthly", () => {
    it("advances by 1 month on a normal date", () => {
      const result = getNextDueDate(new Date("2026-01-15T00:00:00.000Z"), { frequency: "monthly" });
      expect(result.toISOString().slice(0, 10)).toBe("2026-02-15");
    });

    it("clamps Jan 31 → Feb 28 (no overflow into March)", () => {
      const result = getNextDueDate(new Date("2026-01-31T00:00:00.000Z"), { frequency: "monthly" });
      expect(result.toISOString().slice(0, 10)).toBe("2026-02-28");
    });

    it("advances correctly across a year boundary", () => {
      const result = getNextDueDate(new Date("2026-12-20T00:00:00.000Z"), { frequency: "monthly" });
      expect(result.toISOString().slice(0, 10)).toBe("2027-01-20");
    });
  });

  describe("yearly", () => {
    it("advances by 1 year on a normal date", () => {
      const result = getNextDueDate(new Date("2026-03-15T00:00:00.000Z"), { frequency: "yearly" });
      expect(result.toISOString().slice(0, 10)).toBe("2027-03-15");
    });

    it("clamps Feb 29 (leap) → Feb 28 in non-leap year", () => {
      const result = getNextDueDate(new Date("2024-02-29T00:00:00.000Z"), { frequency: "yearly" });
      expect(result.toISOString().slice(0, 10)).toBe("2025-02-28");
    });
  });
});

describe("parseRecurrenceRule", () => {
  it("parses a valid daily rule", () => {
    const result = parseRecurrenceRule('{"frequency":"daily"}');
    expect(result).toEqual({ frequency: "daily" });
  });

  it("parses a valid weekly rule with daysOfWeek", () => {
    const result = parseRecurrenceRule('{"frequency":"weekly","daysOfWeek":[1,3,5]}');
    expect(result).toEqual({ frequency: "weekly", daysOfWeek: [1, 3, 5] });
  });

  it("returns null for invalid JSON", () => {
    expect(parseRecurrenceRule("not-json")).toBeNull();
  });

  it("returns null for JSON without frequency field", () => {
    expect(parseRecurrenceRule('{"type":"daily"}')).toBeNull();
  });

  it("returns null for JSON where frequency is not a string", () => {
    expect(parseRecurrenceRule('{"frequency":42}')).toBeNull();
  });
});

describe("serializeRecurrenceRule", () => {
  it("serializes and round-trips back through parse", () => {
    const rule = { frequency: "weekly" as const, daysOfWeek: [1, 5] };
    const serialized = serializeRecurrenceRule(rule);
    const parsed = parseRecurrenceRule(serialized);
    expect(parsed).toEqual(rule);
  });

  it("serializes a rule without daysOfWeek", () => {
    const rule = { frequency: "monthly" as const };
    const serialized = serializeRecurrenceRule(rule);
    expect(JSON.parse(serialized)).toEqual({ frequency: "monthly" });
  });
});
