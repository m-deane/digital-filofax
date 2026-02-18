"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface HabitStreakChartProps {
  data: Array<{
    habitName: string;
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
  }>;
}

export function HabitStreakChart({ data }: HabitStreakChartProps) {
  const formattedData = data.map((item) => ({
    name: item.habitName.length > 15 ? item.habitName.substring(0, 15) + "..." : item.habitName,
    "Completion Rate": Math.round(item.completionRate),
    "Current Streak": item.currentStreak,
  }));

  const getStreakColor = (rate: number): string => {
    if (rate >= 80) return "#10b981"; // green
    if (rate >= 60) return "#f59e0b"; // yellow
    return "#ef4444"; // red
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Habit Completion Rates</CardTitle>
        <CardDescription>Completion percentage and current streak by habit</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formattedData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Completion Rate" radius={[0, 4, 4, 0]}>
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getStreakColor(entry["Completion Rate"])} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
