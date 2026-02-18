"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { SuggestionCard } from "./suggestion-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, RefreshCw, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SuggestionsPanel() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const utils = api.useUtils();

  const { data: suggestions = [], isLoading } = api.suggestions.getAll.useQuery({
    type: selectedType === "all" ? undefined : (selectedType as "TASK_SUGGESTION" | "PRIORITY_CHANGE" | "DUE_DATE" | "CONTEXT" | "BREAKDOWN" | "RECURRING" | "RESCHEDULE" | "CATEGORY_BALANCE"),
  });

  const regenerate = api.suggestions.regenerate.useMutation({
    onSuccess: (data) => {
      void utils.suggestions.getAll.invalidate();
      void utils.suggestions.getCount.invalidate();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to regenerate suggestions");
    },
  });

  const accept = api.suggestions.accept.useMutation({
    onSuccess: () => {
      void utils.suggestions.getAll.invalidate();
      void utils.suggestions.getCount.invalidate();
      void utils.tasks.getAll.invalidate();
      toast.success("Suggestion applied successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to apply suggestion");
    },
  });

  const dismiss = api.suggestions.dismiss.useMutation({
    onSuccess: () => {
      void utils.suggestions.getAll.invalidate();
      void utils.suggestions.getCount.invalidate();
      toast.success("Suggestion dismissed");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to dismiss suggestion");
    },
  });

  const dismissAll = api.suggestions.dismissAll.useMutation({
    onSuccess: (data) => {
      void utils.suggestions.getAll.invalidate();
      void utils.suggestions.getCount.invalidate();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to dismiss all suggestions");
    },
  });

  const handleAccept = (id: string) => {
    accept.mutate({ id });
  };

  const handleDismiss = (id: string) => {
    dismiss.mutate({ id });
  };

  const handleRegenerate = () => {
    regenerate.mutate();
  };

  const handleDismissAll = () => {
    if (suggestions.length === 0) return;
    if (confirm(`Dismiss all ${suggestions.length} suggestions?`)) {
      dismissAll.mutate();
    }
  };

  const isProcessing = accept.isPending || dismiss.isPending;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Suggestions
              </CardTitle>
              <CardDescription>
                Smart recommendations to help you stay organized and productive
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={regenerate.isPending}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${regenerate.isPending ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              {suggestions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDismissAll}
                  disabled={dismissAll.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Dismiss All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suggestions</SelectItem>
                <SelectItem value="RESCHEDULE">Reschedule</SelectItem>
                <SelectItem value="PRIORITY_CHANGE">Priority</SelectItem>
                <SelectItem value="DUE_DATE">Due Date</SelectItem>
                <SelectItem value="BREAKDOWN">Break Down</SelectItem>
                <SelectItem value="RECURRING">Recurring</SelectItem>
                <SelectItem value="CONTEXT">Context</SelectItem>
                <SelectItem value="CATEGORY_BALANCE">Organization</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {suggestions.length} {suggestions.length === 1 ? "suggestion" : "suggestions"}
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading suggestions...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No suggestions available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click Refresh to generate new suggestions
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  id={suggestion.id}
                  type={suggestion.type}
                  content={suggestion.content}
                  reasoning={suggestion.reasoning}
                  taskTitle={suggestion.task?.title}
                  onAccept={handleAccept}
                  onDismiss={handleDismiss}
                  isProcessing={isProcessing}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
