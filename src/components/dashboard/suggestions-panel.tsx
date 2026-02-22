"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { SuggestionCard } from "./suggestion-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, RefreshCw, Trash2, Filter, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const PRIORITY_COLORS = {
  URGENT: "text-red-600 bg-red-50",
  HIGH: "text-orange-600 bg-orange-50",
  MEDIUM: "text-yellow-600 bg-yellow-50",
  LOW: "text-green-600 bg-green-50",
} as const;

export function SuggestionsPanel() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [aiEnabled, setAiEnabled] = useState(false);
  const utils = api.useUtils();

  const { data: suggestions = [], isLoading } = api.suggestions.getAll.useQuery({
    type: selectedType === "all" ? undefined : (selectedType as "TASK_SUGGESTION" | "PRIORITY_CHANGE" | "DUE_DATE" | "CONTEXT" | "BREAKDOWN" | "RECURRING" | "RESCHEDULE" | "CATEGORY_BALANCE"),
  });

  const { data: aiData, isLoading: aiLoading } = api.suggestions.getAISuggestions.useQuery(
    undefined,
    { enabled: aiEnabled }
  );

  const { data: prefs } = api.preferences.get.useQuery();

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

  const handleGenerateAI = () => {
    setAiEnabled(true);
    void utils.suggestions.getAISuggestions.invalidate();
  };

  const isProcessing = accept.isPending || dismiss.isPending;

  const hasAiKey = prefs?.hasAiKey ?? false;
  const aiSuggestions = aiData?.suggestions ?? [];
  const isRateLimited = aiData?.rateLimited ?? false;

  return (
    <div className="space-y-4">
      {/* AI Suggestions Section */}
      {aiEnabled && aiLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Asking your AI assistant...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {aiEnabled && !aiLoading && isRateLimited && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4">
            <p className="text-sm text-amber-700 text-center">
              AI suggestions refresh every hour. Check back later for new suggestions.
            </p>
          </CardContent>
        </Card>
      )}

      {aiEnabled && !aiLoading && !isRateLimited && aiSuggestions.length > 0 && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI Suggestions
              <Badge variant="secondary" className="text-purple-600 bg-purple-100">
                <Sparkles className="w-3 h-3 mr-1" />
                AI
              </Badge>
            </CardTitle>
            <CardDescription>
              Personalised recommendations from your AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiSuggestions.map((suggestion, index) => (
              <Card key={index} className="overflow-hidden border-l-4 border-l-purple-400 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-50 flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${PRIORITY_COLORS[suggestion.priority]}`}>
                          {suggestion.priority}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {suggestion.actionType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {suggestion.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {aiEnabled && !aiLoading && !isRateLimited && aiSuggestions.length === 0 && !hasAiKey && (
        <Card className="border-dashed border-purple-200">
          <CardContent className="py-6">
            <div className="text-center space-y-2">
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
              <p className="font-medium">Connect AI</p>
              <p className="text-sm text-muted-foreground">
                Add your Anthropic API key in Settings to get personalised suggestions
              </p>
              <Link href="/dashboard/settings">
                <Button variant="outline" size="sm" className="mt-2 gap-2">
                  Go to Settings
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rule-based Suggestions */}
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
                onClick={handleGenerateAI}
                disabled={aiLoading}
              >
                <Sparkles className={`w-4 h-4 mr-2 text-purple-500 ${aiLoading ? "animate-pulse" : ""}`} />
                Generate AI Suggestions
              </Button>
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
