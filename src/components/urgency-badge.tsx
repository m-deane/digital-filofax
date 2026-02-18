import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getUrgencyLevel, getUrgencyColor, getUrgencyLabel } from "@/lib/urgency";
import type { Priority } from "@prisma/client";
import { AlertCircle, Clock } from "lucide-react";

interface UrgencyBadgeProps {
  dueDate?: Date | null;
  priority?: Priority | null;
  status?: string;
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
  variant?: "default" | "compact";
  animate?: boolean;
}

export function UrgencyBadge({
  dueDate,
  priority,
  status,
  showLabel = true,
  showIcon = true,
  className,
  variant = "default",
  animate = true,
}: UrgencyBadgeProps) {
  const urgencyLevel = getUrgencyLevel({ dueDate, priority, status });
  const colors = getUrgencyColor(urgencyLevel);
  const label = getUrgencyLabel({ dueDate, priority, status });

  // Don't show badge if there's no urgency or no label
  if (urgencyLevel === "none" || !label) {
    return null;
  }

  const Icon = urgencyLevel === "critical" ? AlertCircle : Clock;
  const shouldAnimate = animate && urgencyLevel === "critical";

  return (
    <Badge
      variant="secondary"
      className={cn(
        colors.badge,
        "font-medium",
        shouldAnimate && "animate-pulse",
        variant === "compact" && "text-xs px-1.5 py-0",
        className
      )}
    >
      {showIcon && <Icon className={cn("h-3 w-3", showLabel && "mr-1")} />}
      {showLabel && label}
    </Badge>
  );
}

interface UrgencyIndicatorProps {
  dueDate?: Date | null;
  priority?: Priority | null;
  status?: string;
  className?: string;
}

/**
 * Small dot indicator for minimal urgency display
 */
export function UrgencyIndicator({ dueDate, priority, status, className }: UrgencyIndicatorProps) {
  const urgencyLevel = getUrgencyLevel({ dueDate, priority, status });
  const colors = getUrgencyColor(urgencyLevel);

  if (urgencyLevel === "none") {
    return null;
  }

  return (
    <div
      className={cn(
        "h-2 w-2 rounded-full",
        colors.badge,
        urgencyLevel === "critical" && "animate-pulse",
        className
      )}
      title={getUrgencyLabel({ dueDate, priority, status }) ?? undefined}
    />
  );
}

interface PriorityBadgeProps {
  priority: Priority | null | undefined;
  showText?: boolean;
  className?: string;
}

/**
 * Priority badge with color coding
 */
export function PriorityBadge({ priority, showText = true, className }: PriorityBadgeProps) {
  if (!priority) {
    return null;
  }

  const getVariant = (p: Priority) => {
    switch (p) {
      case "URGENT":
        return "destructive";
      case "HIGH":
        return "default";
      case "MEDIUM":
        return "secondary";
      case "LOW":
        return "outline";
      default:
        return "outline";
    }
  };

  const getPriorityDisplay = (p: Priority) => {
    if (!showText) {
      switch (p) {
        case "URGENT":
          return "!!!";
        case "HIGH":
          return "!!";
        case "MEDIUM":
          return "!";
        default:
          return "";
      }
    }
    return p;
  };

  const display = getPriorityDisplay(priority);

  if (!display) {
    return null;
  }

  return (
    <Badge variant={getVariant(priority)} className={cn("text-xs", className)}>
      {display}
    </Badge>
  );
}
