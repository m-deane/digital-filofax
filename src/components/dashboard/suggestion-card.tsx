"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Lightbulb, Calendar, AlertTriangle, Tag, List, Repeat, Target } from "lucide-react";

interface SuggestionCardProps {
  id: string;
  type: string;
  content: string;
  reasoning: string;
  taskTitle?: string;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  isProcessing?: boolean;
}

const SUGGESTION_CONFIG = {
  TASK_SUGGESTION: {
    icon: Lightbulb,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    label: "New Task",
  },
  PRIORITY_CHANGE: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    label: "Priority",
  },
  DUE_DATE: {
    icon: Calendar,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    label: "Due Date",
  },
  CONTEXT: {
    icon: Tag,
    color: "text-green-600",
    bgColor: "bg-green-50",
    label: "Context",
  },
  BREAKDOWN: {
    icon: List,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    label: "Break Down",
  },
  RECURRING: {
    icon: Repeat,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    label: "Recurring",
  },
  RESCHEDULE: {
    icon: Calendar,
    color: "text-red-600",
    bgColor: "bg-red-50",
    label: "Reschedule",
  },
  CATEGORY_BALANCE: {
    icon: Target,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    label: "Organization",
  },
};

export function SuggestionCard({
  id,
  type,
  content,
  reasoning,
  taskTitle,
  onAccept,
  onDismiss,
  isProcessing = false,
}: SuggestionCardProps) {
  const config = SUGGESTION_CONFIG[type as keyof typeof SUGGESTION_CONFIG] || {
    icon: Lightbulb,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    label: "Suggestion",
  };

  const Icon = config.icon;

  return (
    <Card className="overflow-hidden border-l-4 border-l-primary/50 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${config.bgColor} flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.bgColor} ${config.color}`}>
                {config.label}
              </span>
              {taskTitle && (
                <span className="text-xs text-muted-foreground truncate">
                  {taskTitle}
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-foreground mb-1">
              {content}
            </p>

            <p className="text-xs text-muted-foreground">
              {reasoning}
            </p>
          </div>

          <div className="flex gap-1 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => onAccept(id)}
              disabled={isProcessing}
              title="Accept suggestion"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDismiss(id)}
              disabled={isProcessing}
              title="Dismiss suggestion"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
