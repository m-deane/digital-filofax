"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings2,
  Calendar,
  CheckSquare,
  Target,
  Lightbulb,
  Trophy,
  Timer,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  module: string;
}

const AVAILABLE_WIDGETS: WidgetConfig[] = [
  {
    id: "agenda",
    name: "Today's Agenda",
    description: "View today's calendar events",
    icon: Calendar,
    module: "calendar",
  },
  {
    id: "tasks",
    name: "Tasks",
    description: "View upcoming tasks due soon",
    icon: CheckSquare,
    module: "tasks",
  },
  {
    id: "habits",
    name: "Habits",
    description: "Track daily habit completion",
    icon: Target,
    module: "habits",
  },
  {
    id: "ideas",
    name: "Recent Ideas",
    description: "Quick view of captured ideas",
    icon: Lightbulb,
    module: "ideas",
  },
  {
    id: "goals",
    name: "Goals Progress",
    description: "Track progress on your goals",
    icon: Trophy,
    module: "goals",
  },
  {
    id: "focus",
    name: "Focus Timer",
    description: "Pomodoro timer for deep work",
    icon: Timer,
    module: "calendar",
  },
];

export function WidgetPicker() {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  const { data: prefs } = api.preferences.get.useQuery();
  const enabledWidgets = prefs?.enabledWidgets ?? ["agenda", "tasks", "habits"];
  const enabledModules = (prefs?.enabledModules ?? []) as string[];

  const updateWidgets = api.preferences.updateEnabledWidgets.useMutation({
    onSuccess: () => {
      utils.preferences.get.invalidate();
    },
  });

  const toggleWidget = (widgetId: string) => {
    const newWidgets = enabledWidgets.includes(widgetId)
      ? enabledWidgets.filter((w) => w !== widgetId)
      : [...enabledWidgets, widgetId];
    updateWidgets.mutate({ enabledWidgets: newWidgets });
  };

  const availableForUser = AVAILABLE_WIDGETS.filter(
    (w) => enabledModules.includes(w.module)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Customize
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Choose which widgets to display on your dashboard
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {availableForUser.map((widget) => {
            const isEnabled = enabledWidgets.includes(widget.id);
            const Icon = widget.icon;

            return (
              <div
                key={widget.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  isEnabled ? "border-primary/50 bg-primary/5" : "border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      isEnabled ? "bg-primary/10" : "bg-muted"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isEnabled ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{widget.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {widget.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => toggleWidget(widget.id)}
                  disabled={updateWidgets.isPending}
                />
              </div>
            );
          })}

          {availableForUser.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No widgets available. Enable modules in Settings to see widgets.
            </p>
          )}

          {updateWidgets.isPending && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Saving...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
