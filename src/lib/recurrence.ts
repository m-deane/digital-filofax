export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  /** Day indices 0=Sun…6=Sat. Only meaningful when frequency === "weekly". */
  daysOfWeek?: number[];
}

export function parseRecurrenceRule(raw: string): RecurrenceRule | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "frequency" in parsed &&
      typeof (parsed as RecurrenceRule).frequency === "string"
    ) {
      return parsed as RecurrenceRule;
    }
    return null;
  } catch {
    return null;
  }
}

export function serializeRecurrenceRule(rule: RecurrenceRule): string {
  return JSON.stringify(rule);
}

/**
 * Given a current due date and a recurrence rule, returns the next due date.
 * Uses pure Date arithmetic — no external libraries required.
 */
export function getNextDueDate(currentDueDate: Date, rule: RecurrenceRule): Date {
  const d = new Date(currentDueDate);

  switch (rule.frequency) {
    case "daily":
      d.setDate(d.getDate() + 1);
      return d;

    case "weekly": {
      if (!rule.daysOfWeek || rule.daysOfWeek.length === 0) {
        d.setDate(d.getDate() + 7);
        return d;
      }
      const sortedDays = [...rule.daysOfWeek].sort((a, b) => a - b);
      const currentDay = d.getDay(); // 0–6
      const nextInWeek = sortedDays.find((day) => day > currentDay);
      if (nextInWeek !== undefined) {
        d.setDate(d.getDate() + (nextInWeek - currentDay));
      } else {
        // Wrap to next week at the first selected day
        const daysUntil = 7 - currentDay + sortedDays[0]!;
        d.setDate(d.getDate() + daysUntil);
      }
      return d;
    }

    case "monthly": {
      const originalDay = d.getDate();
      d.setMonth(d.getMonth() + 1);
      // Clamp overflow: e.g. Jan 31 → Feb 28 (setMonth may roll into next month)
      if (d.getDate() !== originalDay) {
        d.setDate(0); // last day of the intended month
      }
      return d;
    }

    case "yearly": {
      const origMonth = d.getMonth();
      const origDay = d.getDate();
      d.setFullYear(d.getFullYear() + 1);
      // Clamp Feb 29 → Feb 28 in non-leap years
      if (d.getMonth() !== origMonth || d.getDate() !== origDay) {
        d.setDate(0);
      }
      return d;
    }
  }
}
