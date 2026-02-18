"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PriorityBreakdownProps {
  data: Array<{
    priority: string;
    count: number;
  }>;
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "#ef4444",
  HIGH: "#f59e0b",
  MEDIUM: "#6366f1",
  LOW: "#10b981",
};

const PRIORITY_ORDER = ["URGENT", "HIGH", "MEDIUM", "LOW"];

export function PriorityBreakdown({ data }: PriorityBreakdownProps) {
  // Sort data by priority order
  const sortedData = [...data].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
  );

  const formattedData = sortedData.map((item) => ({
    priority: item.priority.charAt(0) + item.priority.slice(1).toLowerCase(),
    count: item.count,
    originalPriority: item.priority,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks by Priority</CardTitle>
        <CardDescription>Breakdown of completed tasks by priority level</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="priority" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {formattedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PRIORITY_COLORS[entry.originalPriority] ?? "#6366f1"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
