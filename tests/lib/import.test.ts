import { describe, it, expect } from "vitest";
import {
  parseCSV,
  parseTodoistJSON,
  parseAppleReminders,
  parseInternalJSON,
  parseDate,
  validateImportData,
  generateCSVTemplate,
} from "@/lib/import";

describe("Import Parsers", () => {
  // =========================================================================
  // parseCSV
  // =========================================================================
  describe("parseCSV", () => {
    it("should parse valid CSV with all columns", () => {
      const csv = `title,description,dueDate,priority,status,category,tags
"Buy groceries","Weekly shopping","2026-03-01","HIGH","TODO","Personal","shopping,weekly"
"Fix bug","Fix login issue","2026-02-15","URGENT","IN_PROGRESS","Work","dev,urgent"`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].title).toBe("Buy groceries");
      expect(result.data![0].description).toBe("Weekly shopping");
      expect(result.data![0].priority).toBe("HIGH");
      expect(result.data![0].status).toBe("TODO");
      expect(result.data![0].category).toBe("Personal");
      expect(result.data![0].tags).toEqual(["shopping", "weekly"]);
      expect(result.data![0].dueDate).toBeInstanceOf(Date);
    });

    it("should parse CSV with only title column", () => {
      const csv = `title
"Simple task"
"Another task"`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].title).toBe("Simple task");
    });

    it("should fail when CSV has no title column", () => {
      const csv = `description,priority
"Some desc","HIGH"`;

      const result = parseCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("CSV must have a 'title' column");
    });

    it("should fail with only header row (no data)", () => {
      const csv = "title";

      const result = parseCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("CSV file must have at least a header row and one data row");
    });

    it("should skip empty lines", () => {
      const csv = `title
"Task 1"

"Task 2"
`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it("should handle rows with validation errors", () => {
      const csv = `title,priority
"Valid Task","HIGH"
,"MEDIUM"`;

      const result = parseCSV(csv);

      // First row valid, second row has empty title
      expect(result.data!.length).toBeGreaterThanOrEqual(1);
      expect(result.errors.length).toBeGreaterThanOrEqual(0);
    });

    it("should warn about unparseable dates", () => {
      const csv = `title,dueDate
"Task 1","not-a-date"`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some((w) => w.includes("Could not parse date"))).toBe(true);
    });

    it("should handle quoted values with commas", () => {
      const csv = `title,description
"Task, with comma","Description, also with comma"`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.data![0].title).toBe("Task, with comma");
      expect(result.data![0].description).toBe("Description, also with comma");
    });

    it("should fail on empty input", () => {
      const result = parseCSV("");

      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // parseTodoistJSON
  // =========================================================================
  describe("parseTodoistJSON", () => {
    it("should parse array of Todoist tasks", () => {
      const json = JSON.stringify([
        {
          content: "Buy milk",
          description: "From the store",
          due: { date: "2026-03-01" },
          priority: 4, // Todoist urgent
          labels: ["shopping"],
          completed_at: null,
        },
        {
          content: "Read book",
          priority: 1, // Todoist low
          labels: [],
        },
      ]);

      const result = parseTodoistJSON(json);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].title).toBe("Buy milk");
      expect(result.data![0].priority).toBe("URGENT"); // Mapped from 4
      expect(result.data![0].status).toBe("TODO"); // Not completed
      expect(result.data![0].tags).toEqual(["shopping"]);
      expect(result.data![0].dueDate).toBeInstanceOf(Date);

      expect(result.data![1].priority).toBe("LOW"); // Mapped from 1
    });

    it("should parse Todoist export with items field", () => {
      const json = JSON.stringify({
        items: [
          { content: "Task in items", priority: 2 },
        ],
      });

      const result = parseTodoistJSON(json);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].title).toBe("Task in items");
      expect(result.data![0].priority).toBe("MEDIUM");
    });

    it("should map completed tasks to DONE status", () => {
      const json = JSON.stringify([
        { content: "Done task", completed_at: "2026-01-15T10:00:00Z" },
      ]);

      const result = parseTodoistJSON(json);

      expect(result.success).toBe(true);
      expect(result.data![0].status).toBe("DONE");
    });

    it("should handle invalid JSON", () => {
      const result = parseTodoistJSON("not json");

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle invalid Todoist format", () => {
      const result = parseTodoistJSON(JSON.stringify({ notItems: "bad" }));

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Invalid Todoist export format"))).toBe(true);
    });

    it("should map all Todoist priority levels correctly", () => {
      const json = JSON.stringify([
        { content: "P1", priority: 1 },
        { content: "P2", priority: 2 },
        { content: "P3", priority: 3 },
        { content: "P4", priority: 4 },
      ]);

      const result = parseTodoistJSON(json);

      expect(result.data![0].priority).toBe("LOW");
      expect(result.data![1].priority).toBe("MEDIUM");
      expect(result.data![2].priority).toBe("HIGH");
      expect(result.data![3].priority).toBe("URGENT");
    });
  });

  // =========================================================================
  // parseAppleReminders
  // =========================================================================
  describe("parseAppleReminders", () => {
    it("should parse array of Apple Reminders", () => {
      const json = JSON.stringify([
        {
          title: "Call dentist",
          notes: "Schedule checkup",
          dueDate: "2026-04-01",
          completed: false,
          priority: 5, // Apple medium
          list: "Health",
        },
      ]);

      const result = parseAppleReminders(json);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].title).toBe("Call dentist");
      expect(result.data![0].description).toBe("Schedule checkup");
      expect(result.data![0].priority).toBe("MEDIUM");
      expect(result.data![0].status).toBe("TODO");
      expect(result.data![0].category).toBe("Health");
    });

    it("should parse single reminder object (not array)", () => {
      const json = JSON.stringify({
        title: "Single reminder",
        priority: 9,
      });

      const result = parseAppleReminders(json);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].priority).toBe("URGENT"); // 9 >= 8
    });

    it("should map Apple priority levels correctly", () => {
      const json = JSON.stringify([
        { title: "Low", priority: 1 },
        { title: "Medium", priority: 5 },
        { title: "High", priority: 7 },
        { title: "Urgent", priority: 9 },
      ]);

      const result = parseAppleReminders(json);

      expect(result.data![0].priority).toBe("LOW");     // 1 < 3
      expect(result.data![1].priority).toBe("MEDIUM");  // 5 >= 3
      expect(result.data![2].priority).toBe("HIGH");    // 7 >= 6
      expect(result.data![3].priority).toBe("URGENT");  // 9 >= 8
    });

    it("should map completed reminders to DONE status", () => {
      const json = JSON.stringify([
        { title: "Done reminder", completed: true },
      ]);

      const result = parseAppleReminders(json);

      expect(result.data![0].status).toBe("DONE");
    });

    it("should handle invalid JSON", () => {
      const result = parseAppleReminders("{bad json}");

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle reminders without title", () => {
      const json = JSON.stringify([{ notes: "No title here" }]);

      const result = parseAppleReminders(json);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // parseInternalJSON
  // =========================================================================
  describe("parseInternalJSON", () => {
    it("should parse array of internal JSON tasks", () => {
      const json = JSON.stringify([
        {
          title: "Internal Task",
          description: "Description here",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueDate: "2026-05-01",
          category: "Work",
          tags: ["important", "q2"],
          contextId: "ctx-1",
        },
      ]);

      const result = parseInternalJSON(json);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].title).toBe("Internal Task");
      expect(result.data![0].status).toBe("IN_PROGRESS");
      expect(result.data![0].priority).toBe("HIGH");
      expect(result.data![0].tags).toEqual(["important", "q2"]);
      expect(result.data![0].contextId).toBe("ctx-1");
      expect(result.data![0].dueDate).toBeInstanceOf(Date);
    });

    it("should parse single task object (not array)", () => {
      const json = JSON.stringify({
        title: "Single task",
        priority: "LOW",
      });

      const result = parseInternalJSON(json);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it("should reject tasks without title", () => {
      const json = JSON.stringify([
        { description: "No title" },
      ]);

      const result = parseInternalJSON(json);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle invalid JSON", () => {
      const result = parseInternalJSON("not json at all");

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle tasks with no optional fields", () => {
      const json = JSON.stringify([{ title: "Minimal task" }]);

      const result = parseInternalJSON(json);

      expect(result.success).toBe(true);
      expect(result.data![0].title).toBe("Minimal task");
      expect(result.data![0].description).toBeUndefined();
      expect(result.data![0].status).toBeUndefined();
      expect(result.data![0].priority).toBeUndefined();
    });
  });

  // =========================================================================
  // parseDate
  // =========================================================================
  describe("parseDate", () => {
    it("should parse ISO format dates", () => {
      const result = parseDate("2026-03-15");
      expect(result).toBeInstanceOf(Date);
      expect(result!.getFullYear()).toBe(2026);
    });

    it("should parse ISO datetime strings", () => {
      const result = parseDate("2026-03-15T10:30:00Z");
      expect(result).toBeInstanceOf(Date);
    });

    it("should parse MM/DD/YYYY format", () => {
      const result = parseDate("03/15/2026");
      expect(result).toBeInstanceOf(Date);
    });

    it("should return null for empty string", () => {
      const result = parseDate("");
      expect(result).toBeNull();
    });

    it("should return null for unparseable date", () => {
      const result = parseDate("not-a-date");
      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // validateImportData
  // =========================================================================
  describe("validateImportData", () => {
    it("should accept valid tasks", () => {
      const data = [
        { title: "Valid Task 1" },
        { title: "Valid Task 2", description: "desc" },
      ];

      const result = validateImportData(data);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(0);
    });

    it("should reject tasks without title", () => {
      const data = [
        { title: "" },
        { title: "   " },
      ];

      const result = validateImportData(data);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(2);
      expect(result.invalid[0].error).toBe("Title is required");
    });

    it("should reject tasks with title exceeding 500 characters", () => {
      const data = [
        { title: "A".repeat(501) },
      ];

      const result = validateImportData(data);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].error).toContain("too long");
    });

    it("should separate valid and invalid tasks", () => {
      const data = [
        { title: "Good task" },
        { title: "" },
        { title: "Another good task" },
      ];

      const result = validateImportData(data);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
    });
  });

  // =========================================================================
  // generateCSVTemplate
  // =========================================================================
  describe("generateCSVTemplate", () => {
    it("should generate valid CSV template with header and examples", () => {
      const template = generateCSVTemplate();
      const lines = template.split("\n");

      expect(lines.length).toBe(4); // Header + 3 examples
      expect(lines[0]).toBe("title,description,dueDate,priority,status,category,tags");
    });

    it("should include proper header columns", () => {
      const template = generateCSVTemplate();
      const header = template.split("\n")[0];

      expect(header).toContain("title");
      expect(header).toContain("description");
      expect(header).toContain("dueDate");
      expect(header).toContain("priority");
      expect(header).toContain("status");
      expect(header).toContain("category");
      expect(header).toContain("tags");
    });
  });
});
