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
  Legend,
} from "recharts";

interface FocusTimeChartProps {
  data: Array<{
    date: string;
    sessions: number;
    minutes: number;
    hours: number;
  }>;
  totalHours: number;
  totalSessions: number;
}

export function FocusTimeChart({ data, totalHours, totalSessions }: FocusTimeChartProps) {
  const formattedData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Hours: item.hours,
    Sessions: item.sessions,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Focus Sessions</CardTitle>
        <CardDescription>
          Total: {totalHours.toFixed(1)} hours across {totalSessions} sessions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" orientation="left" stroke="#6366f1" />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="Sessions" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
