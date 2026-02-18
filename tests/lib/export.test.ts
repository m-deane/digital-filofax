import { describe, it, expect } from "vitest";
import {
  convertToCSV,
  convertToJSON,
  generateExportFilename,
  prepareTasksForCSV,
  prepareHabitsForCSV,
  prepareMemosForCSV,
  prepareContactsForCSV,
} from "@/lib/export";

describe("Export Utilities", () => {
  // =========================================================================
  // convertToCSV
  // =========================================================================
  describe("convertToCSV", () => {
    it("should convert an array of objects to CSV", () => {
      const data = [
        { name: "Alice", age: 30, city: "NYC" },
        { name: "Bob", age: 25, city: "LA" },
      ];

      const csv = convertToCSV(data);
      const lines = csv.split("\n");

      expect(lines[0]).toBe("name,age,city");
      expect(lines[1]).toBe("Alice,30,NYC");
      expect(lines[2]).toBe("Bob,25,LA");
    });

    it("should return empty string for empty array", () => {
      const csv = convertToCSV([]);
      expect(csv).toBe("");
    });

    it("should exclude specified fields", () => {
      const data = [{ id: "1", name: "Alice", secret: "hidden" }];

      const csv = convertToCSV(data, { excludeFields: ["secret"] });
      const header = csv.split("\n")[0];

      expect(header).toContain("name");
      expect(header).not.toContain("secret");
    });

    it("should handle strings with commas by quoting", () => {
      const data = [{ title: "Hello, World", value: 42 }];

      const csv = convertToCSV(data);
      const dataLine = csv.split("\n")[1];

      expect(dataLine).toContain('"Hello, World"');
    });

    it("should handle strings with quotes by escaping", () => {
      const data = [{ title: 'Say "hello"', value: 1 }];

      const csv = convertToCSV(data);
      const dataLine = csv.split("\n")[1];

      expect(dataLine).toContain('""hello""');
    });

    it("should handle null and undefined values", () => {
      const data = [{ name: "Alice", email: null, phone: undefined }];

      const csv = convertToCSV(data as Record<string, unknown>[]);
      const dataLine = csv.split("\n")[1];

      expect(dataLine).toBe("Alice,,");
    });

    it("should handle boolean values", () => {
      const data = [{ name: "Task", done: true, archived: false }];

      const csv = convertToCSV(data);
      const dataLine = csv.split("\n")[1];

      expect(dataLine).toBe("Task,true,false");
    });

    it("should flatten nested objects", () => {
      const data = [{ name: "Alice", address: { city: "NYC", zip: "10001" } }];

      const csv = convertToCSV(data);
      const header = csv.split("\n")[0];

      expect(header).toContain("address.city");
      expect(header).toContain("address.zip");
    });

    it("should collect all unique keys from all objects", () => {
      const data = [
        { name: "Alice", age: 30 },
        { name: "Bob", email: "bob@test.com" },
      ];

      const csv = convertToCSV(data);
      const header = csv.split("\n")[0];

      expect(header).toContain("name");
      expect(header).toContain("age");
      expect(header).toContain("email");
    });
  });

  // =========================================================================
  // convertToJSON
  // =========================================================================
  describe("convertToJSON", () => {
    it("should return pretty-printed JSON by default", () => {
      const data = { name: "Test", value: 42 };
      const json = convertToJSON(data);

      expect(json).toBe(JSON.stringify(data, null, 2));
      expect(json).toContain("\n");
    });

    it("should return compact JSON when pretty is false", () => {
      const data = { name: "Test", value: 42 };
      const json = convertToJSON(data, { pretty: false });

      expect(json).toBe(JSON.stringify(data));
      expect(json).not.toContain("\n");
    });

    it("should handle arrays", () => {
      const data = [1, 2, 3];
      const json = convertToJSON(data);

      expect(JSON.parse(json)).toEqual(data);
    });

    it("should handle nested objects", () => {
      const data = { user: { name: "Alice", tasks: [{ id: 1 }] } };
      const json = convertToJSON(data);

      expect(JSON.parse(json)).toEqual(data);
    });
  });

  // =========================================================================
  // generateExportFilename
  // =========================================================================
  describe("generateExportFilename", () => {
    it("should generate filename with timestamp", () => {
      const filename = generateExportFilename("tasks", "csv");

      expect(filename).toMatch(/^tasks_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/);
    });

    it("should generate filename without timestamp when disabled", () => {
      const filename = generateExportFilename("tasks", "csv", false);

      expect(filename).toBe("tasks.csv");
    });

    it("should support different extensions", () => {
      const jsonFilename = generateExportFilename("data", "json");
      const csvFilename = generateExportFilename("data", "csv");

      expect(jsonFilename).toMatch(/\.json$/);
      expect(csvFilename).toMatch(/\.csv$/);
    });
  });

  // =========================================================================
  // prepareTasksForCSV
  // =========================================================================
  describe("prepareTasksForCSV", () => {
    it("should flatten task data for CSV export", () => {
      const now = new Date();
      const tasks = [
        {
          id: "task-1",
          title: "Test Task",
          description: "A description",
          status: "TODO",
          priority: "HIGH",
          dueDate: now,
          completedAt: null,
          category: { name: "Work" },
          context: { name: "Office" },
          tags: [{ name: "important" }, { name: "q1" }],
          subtasks: [
            { title: "Sub 1", completed: false },
            { title: "Sub 2", completed: true },
          ],
          createdAt: now,
          updatedAt: now,
        },
      ];

      const result = prepareTasksForCSV(tasks);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Test Task");
      expect(result[0].category).toBe("Work");
      expect(result[0].context).toBe("Office");
      expect(result[0].tags).toBe("important, q1");
      expect(result[0].subtaskCount).toBe(2);
      expect(result[0].subtasks).toBe("Sub 1; Sub 2");
    });

    it("should handle tasks with null relations", () => {
      const now = new Date();
      const tasks = [
        {
          id: "task-1",
          title: "Minimal Task",
          description: null,
          status: "TODO",
          priority: "LOW",
          dueDate: null,
          completedAt: null,
          category: null,
          context: null,
          tags: [],
          subtasks: [],
          createdAt: now,
          updatedAt: now,
        },
      ];

      const result = prepareTasksForCSV(tasks);

      expect(result[0].category).toBeUndefined();
      expect(result[0].context).toBeUndefined();
      expect(result[0].tags).toBe("");
      expect(result[0].subtaskCount).toBe(0);
    });
  });

  // =========================================================================
  // prepareHabitsForCSV
  // =========================================================================
  describe("prepareHabitsForCSV", () => {
    it("should flatten habit data for CSV export", () => {
      const now = new Date();
      const habits = [
        {
          id: "habit-1",
          name: "Exercise",
          description: "Daily workout",
          habitType: "BOOLEAN",
          frequency: "DAILY",
          targetValue: null,
          unit: null,
          category: { name: "Health" },
          isArchived: false,
          createdAt: now,
          updatedAt: now,
          logs: [{ date: now, value: 1 }],
        },
      ];

      const result = prepareHabitsForCSV(habits);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Exercise");
      expect(result[0].category).toBe("Health");
      expect(result[0].logCount).toBe(1);
    });
  });

  // =========================================================================
  // prepareMemosForCSV
  // =========================================================================
  describe("prepareMemosForCSV", () => {
    it("should flatten memo data for CSV export", () => {
      const now = new Date();
      const memos = [
        {
          id: "memo-1",
          title: "Note",
          content: "Some content",
          memoType: "NOTE",
          isPinned: true,
          isArchived: false,
          tags: [{ name: "tag1" }],
          createdAt: now,
          updatedAt: now,
        },
      ];

      const result = prepareMemosForCSV(memos);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Note");
      expect(result[0].isPinned).toBe(true);
      expect(result[0].tags).toBe("tag1");
    });
  });

  // =========================================================================
  // prepareContactsForCSV
  // =========================================================================
  describe("prepareContactsForCSV", () => {
    it("should flatten contact data for CSV export", () => {
      const now = new Date();
      const contacts = [
        {
          id: "contact-1",
          name: "Jane Doe",
          email: "jane@test.com",
          phone: "555-1234",
          address: "123 Main St",
          company: "Acme",
          jobTitle: "Engineer",
          birthday: new Date("1990-01-15"),
          notes: "Met at conference",
          isFavorite: true,
          category: { name: "Professional" },
          createdAt: now,
          updatedAt: now,
        },
      ];

      const result = prepareContactsForCSV(contacts);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Jane Doe");
      expect(result[0].email).toBe("jane@test.com");
      expect(result[0].company).toBe("Acme");
      expect(result[0].isFavorite).toBe(true);
      expect(result[0].category).toBe("Professional");
    });

    it("should handle contacts with null optional fields", () => {
      const now = new Date();
      const contacts = [
        {
          id: "contact-1",
          name: "John",
          email: null,
          phone: null,
          address: null,
          company: null,
          jobTitle: null,
          birthday: null,
          notes: null,
          isFavorite: false,
          category: null,
          createdAt: now,
          updatedAt: now,
        },
      ];

      const result = prepareContactsForCSV(contacts);

      expect(result[0].email).toBeNull();
      expect(result[0].category).toBeUndefined();
    });
  });
});
