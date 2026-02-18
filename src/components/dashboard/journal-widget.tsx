"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function JournalWidget() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Journal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Track your gratitude and mood daily.
        </p>
        <Link href="/dashboard/journal">
          <Button variant="outline" size="sm" className="w-full">
            Open Journal
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
