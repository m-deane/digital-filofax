/**
 * Parses a Markdown TODO file into structured project data.
 *
 * Supported syntax:
 *   - [ ] unchecked task  → status: TODO
 *   - [x] checked task    → status: DONE
 *   - [X] checked task    → status: DONE
 *   # Heading             → project name (first H1) or section separator
 *   Nested items (2+ spaces or tab before dash) → subtasks of previous item
 */

export interface ParsedSubtask {
  title: string;
  completed: boolean;
}

export interface ParsedTask {
  title: string;
  completed: boolean;
  subtasks: ParsedSubtask[];
}

export interface ParsedMarkdownProject {
  name: string;
  tasks: ParsedTask[];
  errors: string[];
  warnings: string[];
}

export interface MarkdownParseResult {
  success: boolean;
  data: ParsedMarkdownProject | null;
  errors: string[];
  warnings: string[];
}

// Matches: optional leading whitespace, dash, space, bracket, optional x/X, bracket, space, rest
const TASK_LINE = /^(\s*)- \[([xX ])\] (.+)$/;
const HEADING_LINE = /^#{1,3}\s+(.+)$/;

function indentLevel(line: string): number {
  let count = 0;
  for (const ch of line) {
    if (ch === " ") count++;
    else if (ch === "\t") count += 2;
    else break;
  }
  return count;
}

export function parseMarkdownTodo(
  content: string,
  filename = "import.md"
): MarkdownParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content.trim()) {
    errors.push("File is empty");
    return { success: false, data: null, errors, warnings };
  }

  // Derive a project name from the filename (strip path and extension)
  let projectName = filename
    .split(/[\\/]/)
    .pop()!
    .replace(/\.(md|markdown|txt)$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || "Imported Project";

  const lines = content.split(/\r?\n/);
  const tasks: ParsedTask[] = [];
  let lastTaskIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Use the first heading as the project name
    const headingMatch = HEADING_LINE.exec(line);
    if (headingMatch) {
      if (tasks.length === 0) {
        projectName = headingMatch[1]!.trim();
      }
      continue;
    }

    const taskMatch = TASK_LINE.exec(line);
    if (!taskMatch) continue;

    const indent = indentLevel(line);
    const checked = taskMatch[2]!.toLowerCase() === "x";
    const title = taskMatch[3]!.trim();

    if (!title) {
      warnings.push(`Line ${i + 1}: empty task title, skipped`);
      continue;
    }

    if (title.length > 500) {
      warnings.push(`Line ${i + 1}: task title truncated to 500 characters`);
    }

    if (indent === 0) {
      // Top-level task
      tasks.push({ title: title.slice(0, 500), completed: checked, subtasks: [] });
      lastTaskIdx = tasks.length - 1;
    } else {
      // Indented → subtask of the last top-level task
      if (lastTaskIdx < 0) {
        warnings.push(`Line ${i + 1}: indented task has no parent, promoted to top-level`);
        tasks.push({ title: title.slice(0, 500), completed: checked, subtasks: [] });
        lastTaskIdx = tasks.length - 1;
      } else {
        tasks[lastTaskIdx]!.subtasks.push({
          title: title.slice(0, 500),
          completed: checked,
        });
      }
    }
  }

  if (tasks.length === 0) {
    warnings.push("No tasks found in the file");
  }

  return {
    success: true,
    data: { name: projectName, tasks, errors: [], warnings },
    errors,
    warnings,
  };
}
