"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface CategoryDistributionProps {
  data: Array<{
    name: string;
    count: number;
  }>;
  title?: string;
  description?: string;
}

const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export function CategoryDistribution({
  data,
  title = "Tasks by Category",
  description = "Distribution of completed tasks across categories",
}: CategoryDistributionProps) {
  const formattedData = data.map((item, index) => ({
    name: item.name,
    value: item.count,
    color: COLORS[index % COLORS.length],
  }));

  const total = data.reduce((acc, item) => acc + item.count, 0);

  const renderLabel = (entry: { name: string; value: number; percent: number }) => {
    const percentage = ((entry.value / total) * 100).toFixed(0);
    return `${entry.name} (${percentage}%)`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
