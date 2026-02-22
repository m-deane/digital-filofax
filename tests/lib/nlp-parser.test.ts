import { describe, it, expect, beforeEach } from "vitest";
import { parseTaskInput, hasNlpTokens, formatParsedPreview } from "@/lib/nlp-parser";

// Use a fixed reference date for deterministic tests
const REFERENCE_DATE = new Date("2026-02-22T10:00:00.000Z"); // Sunday Feb 22 2026

describe("parseTaskInput", () => {
  describe("title extraction", () => {
    it("returns the full input as title when no tokens", () => {
      const result = parseTaskInput("Buy groceries", REFERENCE_DATE);
      expect(result.title).toBe("Buy groceries");
    });

    it("strips priority token from title", () => {
      const result = parseTaskInput("Call dentist !high", REFERENCE_DATE);
      expect(result.title).toBe("Call dentist");
    });

    it("strips category from title", () => {
      const result = parseTaskInput("Buy vitamins #health", REFERENCE_DATE);
      expect(result.title).toBe("Buy vitamins");
    });

    it("strips context from title", () => {
      const result = parseTaskInput("Schedule call @phone", REFERENCE_DATE);
      expect(result.title).toBe("Schedule call");
    });

    it("strips multiple tokens leaving clean title", () => {
      const result = parseTaskInput("Call dentist tomorrow !high #health @phone", REFERENCE_DATE);
      expect(result.title).toBe("Call dentist");
    });

    it("preserves title when only spaces remain after stripping", () => {
      const result = parseTaskInput("!high", REFERENCE_DATE);
      // When title is empty, falls back to rawInput
      expect(result.rawInput).toBe("!high");
    });
  });

  describe("priority parsing", () => {
    it("parses !urgent", () => {
      expect(parseTaskInput("Task !urgent", REFERENCE_DATE).priority).toBe("URGENT");
    });

    it("parses !high", () => {
      expect(parseTaskInput("Task !high", REFERENCE_DATE).priority).toBe("HIGH");
    });

    it("parses !medium", () => {
      expect(parseTaskInput("Task !medium", REFERENCE_DATE).priority).toBe("MEDIUM");
    });

    it("parses !low", () => {
      expect(parseTaskInput("Task !low", REFERENCE_DATE).priority).toBe("LOW");
    });

    it("parses p1 as URGENT", () => {
      expect(parseTaskInput("Task p1", REFERENCE_DATE).priority).toBe("URGENT");
    });

    it("parses p2 as HIGH", () => {
      expect(parseTaskInput("Task p2", REFERENCE_DATE).priority).toBe("HIGH");
    });

    it("parses p3 as MEDIUM", () => {
      expect(parseTaskInput("Task p3", REFERENCE_DATE).priority).toBe("MEDIUM");
    });

    it("parses p4 as LOW", () => {
      expect(parseTaskInput("Task p4", REFERENCE_DATE).priority).toBe("LOW");
    });

    it("returns null when no priority", () => {
      expect(parseTaskInput("Buy milk", REFERENCE_DATE).priority).toBeNull();
    });

    it("is case insensitive for !HIGH", () => {
      expect(parseTaskInput("Task !HIGH", REFERENCE_DATE).priority).toBe("HIGH");
    });
  });

  describe("category parsing", () => {
    it("parses single category", () => {
      expect(parseTaskInput("Task #health", REFERENCE_DATE).categories).toEqual(["health"]);
    });

    it("parses multiple categories", () => {
      const result = parseTaskInput("Task #health #work", REFERENCE_DATE);
      expect(result.categories).toEqual(["health", "work"]);
    });

    it("lowercases categories", () => {
      expect(parseTaskInput("Task #HEALTH", REFERENCE_DATE).categories).toEqual(["health"]);
    });

    it("returns empty array when no categories", () => {
      expect(parseTaskInput("Buy milk", REFERENCE_DATE).categories).toEqual([]);
    });

    it("parses hyphenated categories", () => {
      expect(parseTaskInput("Task #side-project", REFERENCE_DATE).categories).toEqual(["side-project"]);
    });
  });

  describe("context parsing", () => {
    it("parses single context", () => {
      expect(parseTaskInput("Task @phone", REFERENCE_DATE).contexts).toEqual(["phone"]);
    });

    it("parses multiple contexts", () => {
      const result = parseTaskInput("Task @phone @office", REFERENCE_DATE);
      expect(result.contexts).toEqual(["phone", "office"]);
    });

    it("lowercases contexts", () => {
      expect(parseTaskInput("Task @PHONE", REFERENCE_DATE).contexts).toEqual(["phone"]);
    });

    it("returns empty array when no contexts", () => {
      expect(parseTaskInput("Buy milk", REFERENCE_DATE).contexts).toEqual([]);
    });
  });

  describe("date parsing", () => {
    it("parses 'tomorrow'", () => {
      const result = parseTaskInput("Call dentist tomorrow", REFERENCE_DATE);
      expect(result.dueDate).not.toBeNull();
      if (result.dueDate) {
        // Tomorrow from Feb 22 = Feb 23
        expect(result.dueDate.getDate()).toBe(23);
        expect(result.dueDate.getMonth()).toBe(1); // February
      }
    });

    it("parses 'today'", () => {
      const result = parseTaskInput("Finish report today", REFERENCE_DATE);
      expect(result.dueDate).not.toBeNull();
      if (result.dueDate) {
        expect(result.dueDate.getDate()).toBe(22);
        expect(result.dueDate.getMonth()).toBe(1); // February
      }
    });

    it("returns null dueDate when no date", () => {
      expect(parseTaskInput("Buy groceries", REFERENCE_DATE).dueDate).toBeNull();
    });

    it("returns null dueTime when date has no time", () => {
      const result = parseTaskInput("Call dentist tomorrow", REFERENCE_DATE);
      expect(result.dueTime).toBeNull();
    });

    it("parses specific time 'at 2pm'", () => {
      const result = parseTaskInput("Call dentist tomorrow at 2pm", REFERENCE_DATE);
      expect(result.dueTime).toBe("14:00");
    });

    it("parses specific time 'at 9am'", () => {
      const result = parseTaskInput("Meeting today at 9am", REFERENCE_DATE);
      expect(result.dueTime).toBe("09:00");
    });

    it("parses specific time 'at 14:30'", () => {
      const result = parseTaskInput("Meeting tomorrow at 14:30", REFERENCE_DATE);
      expect(result.dueTime).toBe("14:30");
    });
  });

  describe("combined parsing", () => {
    it("parses all fields together", () => {
      const result = parseTaskInput("Call dentist tomorrow at 2pm !high #health @phone", REFERENCE_DATE);
      expect(result.title).toBe("Call dentist");
      expect(result.priority).toBe("HIGH");
      expect(result.categories).toEqual(["health"]);
      expect(result.contexts).toEqual(["phone"]);
      expect(result.dueDate).not.toBeNull();
      expect(result.dueTime).toBe("14:00");
    });

    it("parses title with date and priority", () => {
      const result = parseTaskInput("Buy groceries tomorrow p2", REFERENCE_DATE);
      expect(result.title).toBe("Buy groceries");
      expect(result.priority).toBe("HIGH");
      expect(result.dueDate).not.toBeNull();
    });

    it("preserves rawInput", () => {
      const input = "Task !high #work";
      const result = parseTaskInput(input, REFERENCE_DATE);
      expect(result.rawInput).toBe(input);
    });
  });
});

describe("hasNlpTokens", () => {
  it("returns true for # tokens", () => {
    expect(hasNlpTokens("Task #work")).toBe(true);
  });

  it("returns true for @ tokens", () => {
    expect(hasNlpTokens("Task @phone")).toBe(true);
  });

  it("returns true for priority tokens", () => {
    expect(hasNlpTokens("Task !high")).toBe(true);
  });

  it("returns true for date keywords", () => {
    expect(hasNlpTokens("Task tomorrow")).toBe(true);
    expect(hasNlpTokens("Task today")).toBe(true);
    expect(hasNlpTokens("Task next monday")).toBe(true);
  });

  it("returns false for plain text", () => {
    expect(hasNlpTokens("Buy milk")).toBe(false);
    expect(hasNlpTokens("Call dentist")).toBe(false);
  });
});

describe("formatParsedPreview", () => {
  it("returns empty string for task with no parsed fields", () => {
    const result = parseTaskInput("Buy milk", REFERENCE_DATE);
    expect(formatParsedPreview(result)).toBe("");
  });

  it("includes priority in preview", () => {
    const result = parseTaskInput("Task !high", REFERENCE_DATE);
    expect(formatParsedPreview(result)).toContain("High");
  });

  it("includes categories in preview", () => {
    const result = parseTaskInput("Task #health", REFERENCE_DATE);
    expect(formatParsedPreview(result)).toContain("#health");
  });

  it("includes contexts in preview", () => {
    const result = parseTaskInput("Task @phone", REFERENCE_DATE);
    expect(formatParsedPreview(result)).toContain("@phone");
  });
});
