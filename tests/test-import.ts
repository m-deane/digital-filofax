import { parseCSV, parseTodoistJSON, parseAppleReminders, parseInternalJSON, generateCSVTemplate } from "../src/lib/import";

// Test CSV parsing
console.log("Testing CSV parsing...");
const csvData = `title,description,dueDate,priority,status,category,tags
"Test Task 1","Description 1","2026-03-15","HIGH","TODO","Work","project,important"
"Test Task 2","Description 2","2026-02-20","MEDIUM","IN_PROGRESS","Personal","shopping"`;

const csvResult = parseCSV(csvData);
console.log("CSV Result:", JSON.stringify(csvResult, null, 2));

// Test Todoist JSON parsing
console.log("\nTesting Todoist JSON parsing...");
const todoistData = JSON.stringify([
  {
    content: "Buy groceries",
    description: "Get milk and eggs",
    due: { date: "2026-02-10" },
    priority: 3,
    labels: ["shopping", "urgent"],
  },
  {
    content: "Call dentist",
    priority: 1,
  },
]);

const todoistResult = parseTodoistJSON(todoistData);
console.log("Todoist Result:", JSON.stringify(todoistResult, null, 2));

// Test Apple Reminders parsing
console.log("\nTesting Apple Reminders parsing...");
const appleData = JSON.stringify([
  {
    title: "Team meeting",
    notes: "Discuss Q1 planning",
    dueDate: "2026-02-08",
    priority: 7,
    list: "Work",
    completed: false,
  },
]);

const appleResult = parseAppleReminders(appleData);
console.log("Apple Result:", JSON.stringify(appleResult, null, 2));

// Test Internal JSON parsing
console.log("\nTesting Internal JSON parsing...");
const internalData = JSON.stringify([
  {
    title: "Write report",
    description: "Q1 quarterly report",
    status: "TODO",
    priority: "HIGH",
    dueDate: "2026-03-01",
    category: "Work",
    tags: ["report", "quarterly"],
  },
]);

const internalResult = parseInternalJSON(internalData);
console.log("Internal JSON Result:", JSON.stringify(internalResult, null, 2));

// Test CSV template generation
console.log("\nTesting CSV template generation...");
const template = generateCSVTemplate();
console.log("CSV Template:\n", template);

console.log("\nAll tests completed!");
