"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProductivityTrendProps {
  data: Array<{
    date: string;
    score: number;
    tasksCompleted: number;
    habitsCompleted: number;
    focusMinutes: number;
  }>;
  averageScore: number;
}

export function ProductivityTrend({ data, averageScore }: ProductivityTrendProps) {
  const formattedData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: item.score,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productivity Score</CardTitle>
        <CardDescription>
          Daily productivity score (0-100) - Average: {averageScore.toFixed(1)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorScore)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
