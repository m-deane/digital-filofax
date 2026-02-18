"use client";

import { useMemo } from "react";
import { startOfDay, subDays, addDays, format, getDay } from "date-fns";
import { cn } from "@/lib/utils";

interface HeatmapDataPoint {
  date: string;
  count: number;
  habits: Array<{ id: string; name: string; color: string }>;
}

interface HabitHeatmapProps {
  data: HeatmapDataPoint[];
  className?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Mon", "Wed", "Fri"];

function getColorIntensity(count: number): string {
  if (count === 0) return "bg-gray-100 dark:bg-gray-800";
  if (count === 1) return "bg-green-200 dark:bg-green-900/40";
  if (count === 2) return "bg-green-400 dark:bg-green-700/60";
  if (count === 3) return "bg-green-600 dark:bg-green-600/80";
  return "bg-green-800 dark:bg-green-500";
}

export function HabitHeatmap({ data, className }: HabitHeatmapProps) {
  const { weeks, monthLabels } = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = subDays(today, 364); // 365 days including today

    // Adjust to start on Sunday for proper grid alignment
    const dayOfWeek = getDay(startDate);
    const gridStartDate = subDays(startDate, dayOfWeek);

    // Create a map of dates to data
    const dataMap = new Map<string, HeatmapDataPoint>();
    data.forEach((point) => {
      dataMap.set(point.date, point);
    });

    // Generate weeks array (52-53 weeks of 7 days)
    const weeksData: Array<Array<{ date: Date; data: HeatmapDataPoint | null }>> = [];
    let currentDate = gridStartDate;
    const endDate = today;

    while (currentDate <= endDate) {
      const week: Array<{ date: Date; data: HeatmapDataPoint | null }> = [];

      for (let day = 0; day < 7; day++) {
        const dateKey = format(currentDate, "yyyy-MM-dd");
        const dataPoint = dataMap.get(dateKey) ?? null;

        // Only include if within the actual range (not padding days)
        if (currentDate >= startDate && currentDate <= endDate) {
          week.push({ date: currentDate, data: dataPoint });
        } else {
          week.push({ date: currentDate, data: null });
        }

        currentDate = addDays(currentDate, 1);
      }

      weeksData.push(week);
    }

    // Generate month labels
    const monthLabelsData: Array<{ label: string; weekIndex: number }> = [];
    let lastMonth = -1;

    weeksData.forEach((week, weekIndex) => {
      const firstDay = week[0];
      if (firstDay && firstDay.date >= startDate) {
        const month = firstDay.date.getMonth();
        if (month !== lastMonth && weekIndex > 0) {
          monthLabelsData.push({
            label: MONTHS[month] ?? "",
            weekIndex,
          });
          lastMonth = month;
        }
      }
    });

    return { weeks: weeksData, monthLabels: monthLabelsData };
  }, [data]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Month labels */}
      <div className="flex gap-1 pl-8">
        {monthLabels.map((monthLabel) => (
          <div
            key={`${monthLabel.label}-${monthLabel.weekIndex}`}
            className="text-xs text-muted-foreground"
            style={{
              marginLeft: monthLabel.weekIndex === 0 ? 0 : `${(monthLabel.weekIndex * 14)}px`,
            }}
          >
            {monthLabel.label}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col justify-between text-xs text-muted-foreground pr-1" style={{ height: "105px" }}>
          {DAY_LABELS.map((label) => (
            <div key={label} style={{ lineHeight: "10px" }}>
              {label}
            </div>
          ))}
        </div>

        {/* Grid container with horizontal scroll */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => {
                const isOutOfRange = day.data === null && (day.date < subDays(new Date(), 364) || day.date > new Date());
                const count = day.data?.count ?? 0;
                const dateStr = format(day.date, "MMM d, yyyy");
                const habitsList = day.data?.habits.map((h) => h.name).join(", ") ?? "";

                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      "w-[10px] h-[10px] rounded-sm transition-colors cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-primary",
                      isOutOfRange ? "opacity-0" : getColorIntensity(count)
                    )}
                    title={isOutOfRange ? "" : `${dateStr}${count > 0 ? `\n${count} ${count === 1 ? "habit" : "habits"}: ${habitsList}` : "\nNo habits completed"}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-[10px] h-[10px] rounded-sm bg-gray-100 dark:bg-gray-800" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-200 dark:bg-green-900/40" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-400 dark:bg-green-700/60" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-600 dark:bg-green-600/80" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-800 dark:bg-green-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
