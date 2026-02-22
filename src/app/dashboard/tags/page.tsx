"use client";

import Link from "next/link";
import { Tag, Plus, CheckSquare, FileText, Lightbulb, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";

function TagCard({
  tag,
}: {
  tag: {
    id: string;
    name: string;
    color: string;
    _count: { tasks: number; memos: number; ideas: number };
  };
}) {
  const total = tag._count.tasks + tag._count.memos + tag._count.ideas;

  return (
    <Link href={`/dashboard/tags/${tag.id}`}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <CardTitle className="text-base font-medium truncate">{tag.name}</CardTitle>
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {total} item{total !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {tag._count.tasks > 0 && (
              <span className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                {tag._count.tasks} task{tag._count.tasks !== 1 ? "s" : ""}
              </span>
            )}
            {tag._count.memos > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {tag._count.memos} memo{tag._count.memos !== 1 ? "s" : ""}
              </span>
            )}
            {tag._count.ideas > 0 && (
              <span className="flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                {tag._count.ideas} idea{tag._count.ideas !== 1 ? "s" : ""}
              </span>
            )}
            {total === 0 && <span className="italic">No items tagged yet</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function TagsPage() {
  const { data: tags, isLoading } = api.tags.getAll.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tag Index</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cross-reference everything in your planner by tag
          </p>
        </div>
        <Link href="/dashboard/memos">
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Manage Tags
          </Button>
        </Link>
      </div>

      {!tags || tags.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-lg mb-2">No tags yet</CardTitle>
            <CardDescription>
              Add tags to your tasks, memos, and ideas to see them grouped here.
              Tags let you cross-reference items across all your planner sections.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tags.map((tag) => (
            <TagCard key={tag.id} tag={tag} />
          ))}
        </div>
      )}
    </div>
  );
}
