"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TaskCompletionChartProps {
  data: Array<{
    date: string;
    completed: number;
    created: number;
  }>;
  chartType?: "line" | "bar";
}

export function TaskCompletionChart({ data, chartType = "line" }: TaskCompletionChartProps) {
  const formattedData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Completed: item.completed,
    Created: item.created,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Completion Trend</CardTitle>
        <CardDescription>Tasks completed vs created over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === "line" ? (
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Completed"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Created"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          ) : (
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Completed" fill="#10b981" />
              <Bar dataKey="Created" fill="#6366f1" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
