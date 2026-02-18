"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, ArrowRight, Loader2, Flag } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { api } from "@/lib/trpc";

export function GoalsWidget() {
  const { data: goals, isLoading } = api.goals.getAll.useQuery({
    status: "IN_PROGRESS",
  });

  const { data: stats } = api.goals.getStats.useQuery();

  // Get goals that are in progress or have upcoming milestones
  const activeGoals = goals?.slice(0, 3) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Goals</CardTitle>
          <p className="text-sm text-muted-foreground">
            {stats?.inProgress ?? 0} in progress
          </p>
        </div>
        <Link href="/dashboard/goals">
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && activeGoals.length === 0 && (
          <div className="text-center py-4">
            <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No active goals</p>
            <Link href="/dashboard/goals">
              <Button variant="outline" size="sm" className="mt-2">
                Create Goal
              </Button>
            </Link>
          </div>
        )}

        {!isLoading &&
          activeGoals.map((goal) => {
            const completedMilestones = goal.milestones.filter(
              (m) => m.completed
            ).length;
            const progress =
              goal.milestones.length > 0
                ? Math.round(
                    (completedMilestones / goal.milestones.length) * 100
                  )
                : 0;
            const nextMilestone = goal.milestones.find((m) => !m.completed);

            return (
              <div key={goal.id} className="space-y-2 p-3 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{goal.title}</p>
                    {goal.deadline && (
                      <p className="text-xs text-muted-foreground">
                        Due {format(new Date(goal.deadline), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">{progress}%</Badge>
                </div>
                <Progress value={progress} className="h-1.5" />
                {nextMilestone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Flag className="h-3 w-3" />
                    <span>Next: {nextMilestone.title}</span>
                  </div>
                )}
              </div>
            );
          })}

        {/* Upcoming Milestones */}
        {stats && stats.upcomingMilestones.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Upcoming Milestones
            </p>
            <div className="space-y-1">
              {stats.upcomingMilestones.slice(0, 3).map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="truncate">{milestone.title}</span>
                  <span className="text-muted-foreground">
                    {format(new Date(milestone.date), "MMM d")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
