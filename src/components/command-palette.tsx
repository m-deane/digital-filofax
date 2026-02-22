"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CalendarClock,
  CheckSquare,
  Target,
  FileText,
  Lightbulb,
  Trophy,
  Users,
  DollarSign,
  Heart,
  BarChart3,
  Sparkles,
  RefreshCcw,
  Settings,
  Moon,
  Sun,
  Plus,
  AtSign,
  CloudOff,
  Share2,
  Github,
  FileStack,
  Compass,
  Calendar,
  CalendarDays,
  FolderKanban,
  CalendarRange,
  Image,
  LayoutDashboard,
  Tag,
  LayoutGrid,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuickCapture?: () => void;
}

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard, section: "Planners" },
  { label: "Daily Planner", href: "/dashboard/daily", icon: CalendarClock, section: "Planners" },
  { label: "Weekly Planner", href: "/dashboard/planner/weekly", icon: Calendar, section: "Planners" },
  { label: "Monthly Planner", href: "/dashboard/planner/monthly", icon: CalendarDays, section: "Planners" },
  { label: "Life Roles", href: "/dashboard/roles", icon: Compass, section: "Planners" },
  { label: "Tasks", href: "/dashboard/tasks", icon: CheckSquare, section: "Tasks" },
  { label: "Priority Matrix", href: "/dashboard/tasks/matrix", icon: LayoutGrid, section: "Tasks" },
  { label: "Weekly Tasks", href: "/dashboard/weekly", icon: FolderKanban, section: "Tasks" },
  { label: "Monthly Tasks", href: "/dashboard/monthly", icon: CalendarRange, section: "Tasks" },
  { label: "Habits", href: "/dashboard/habits", icon: Target, section: "Capture" },
  { label: "Memos", href: "/dashboard/memos", icon: FileText, section: "Capture" },
  { label: "Ideas", href: "/dashboard/ideas", icon: Lightbulb, section: "Capture" },
  { label: "Contacts", href: "/dashboard/contacts", icon: Users, section: "Capture" },
  { label: "Journal", href: "/dashboard/journal", icon: Heart, section: "Capture" },
  { label: "Finance", href: "/dashboard/finance", icon: DollarSign, section: "Capture" },
  { label: "GitHub", href: "/dashboard/github", icon: Github, section: "Capture" },
  { label: "Templates", href: "/dashboard/templates", icon: FileStack, section: "Capture" },
  { label: "Tag Index", href: "/dashboard/tags", icon: Tag, section: "Capture" },
  { label: "Goals", href: "/dashboard/goals", icon: Trophy, section: "Goals" },
  { label: "Vision Board", href: "/dashboard/vision", icon: Image, section: "Goals" },
  { label: "Contexts", href: "/dashboard/contexts", icon: AtSign, section: "Goals" },
  { label: "Someday/Maybe", href: "/dashboard/someday", icon: CloudOff, section: "Goals" },
  { label: "Shared Lists", href: "/dashboard/shared", icon: Share2, section: "Collaborate" },
  { label: "AI Suggestions", href: "/dashboard/suggestions", icon: Sparkles, section: "Insights" },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, section: "Insights" },
  { label: "Weekly Review", href: "/dashboard/review", icon: RefreshCcw, section: "Review" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, section: "Settings" },
];

const NAV_SECTIONS = Array.from(new Set(NAV_ITEMS.map((i) => i.section)));

export function CommandPalette({ open, onOpenChange, onQuickCapture }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState("");

  const runCommand = useCallback(
    (action: () => void) => {
      onOpenChange(false);
      setSearch("");
      action();
    },
    [onOpenChange]
  );

  // Reset search when closed
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or navigate..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Create */}
        <CommandGroup heading="Create">
          <CommandItem
            onSelect={() => runCommand(() => onQuickCapture?.())}
            value="create new task note idea quick capture"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Quick Capture</span>
            <CommandShortcut>⌘J</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation by section */}
        {NAV_SECTIONS.map((section) => {
          const items = NAV_ITEMS.filter((i) => i.section === section);
          return (
            <CommandGroup key={section} heading={`Go to — ${section}`}>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    value={`navigate go to ${item.label} ${section}`}
                    onSelect={() => runCommand(() => router.push(item.href))}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}

        <CommandSeparator />

        {/* App Actions */}
        <CommandGroup heading="App">
          <CommandItem
            value="toggle theme dark light mode appearance"
            onSelect={() =>
              runCommand(() => setTheme(theme === "dark" ? "light" : "dark"))
            }
          >
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            <span>Toggle {theme === "dark" ? "Light" : "Dark"} Mode</span>
          </CommandItem>
          <CommandItem
            value="settings preferences account"
            onSelect={() => runCommand(() => router.push("/dashboard/settings"))}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Open Settings</span>
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
