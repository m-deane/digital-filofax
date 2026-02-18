"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  CalendarDays,
  CalendarClock,
  Target,
  FileText,
  Lightbulb,
  Settings,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  CalendarRange,
  Trophy,
  Users,
  FileStack,
  CloudOff,
  Compass,
  DollarSign,
  Heart,
  Github,
  RefreshCcw,
  AtSign,
  BarChart3,
  Sparkles,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { useEnabledModules } from "@/hooks/use-modules";
import type { ModuleId } from "@/lib/modules";
import { api } from "@/lib/trpc";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  module?: ModuleId; // Which module this item belongs to
}

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    // Dashboard is always visible
  },
  {
    title: "Tasks",
    href: "/dashboard/tasks",
    icon: CheckSquare,
    module: "tasks",
  },
  {
    title: "Weekly Tasks",
    href: "/dashboard/weekly",
    icon: FolderKanban,
    module: "tasks",
  },
  {
    title: "Monthly Tasks",
    href: "/dashboard/monthly",
    icon: CalendarRange,
    module: "tasks",
  },
];

const plannerNavItems: NavItem[] = [
  {
    title: "Life Roles",
    href: "/dashboard/roles",
    icon: Compass,
    module: "planning",
  },
  {
    title: "Daily Planner",
    href: "/dashboard/daily",
    icon: CalendarClock,
    module: "calendar",
  },
  {
    title: "Weekly Planner",
    href: "/dashboard/planner/weekly",
    icon: Calendar,
    module: "calendar",
  },
  {
    title: "Monthly Planner",
    href: "/dashboard/planner/monthly",
    icon: CalendarDays,
    module: "calendar",
  },
];

const captureNavItems: NavItem[] = [
  {
    title: "Habits",
    href: "/dashboard/habits",
    icon: Target,
    module: "habits",
  },
  {
    title: "Memos",
    href: "/dashboard/memos",
    icon: FileText,
    module: "memos",
  },
  {
    title: "Ideas",
    href: "/dashboard/ideas",
    icon: Lightbulb,
    module: "ideas",
  },
  {
    title: "Contacts",
    href: "/dashboard/contacts",
    icon: Users,
    module: "contacts",
  },
  {
    title: "Journal",
    href: "/dashboard/journal",
    icon: Heart,
    module: "journal",
  },
  {
    title: "Finance",
    href: "/dashboard/finance",
    icon: DollarSign,
    module: "finance",
  },
  {
    title: "GitHub",
    href: "/dashboard/github",
    icon: Github,
    module: "github",
  },
  {
    title: "Templates",
    href: "/dashboard/templates",
    icon: FileStack,
  },
];

const goalsNavItems: NavItem[] = [
  {
    title: "Goals",
    href: "/dashboard/goals",
    icon: Trophy,
    module: "goals",
  },
  {
    title: "Contexts",
    href: "/dashboard/contexts",
    icon: AtSign,
    module: "tasks",
  },
  {
    title: "Someday/Maybe",
    href: "/dashboard/someday",
    icon: CloudOff,
    module: "someday",
  },
];

const collaborateNavItems: NavItem[] = [
  {
    title: "Shared Lists",
    href: "/dashboard/shared",
    icon: Share2,
    module: "collaboration",
  },
];

const insightsNavItems: NavItem[] = [
  {
    title: "AI Suggestions",
    href: "/dashboard/suggestions",
    icon: Sparkles,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
];

const reviewNavItems: NavItem[] = [
  {
    title: "Weekly Review",
    href: "/dashboard/review",
    icon: RefreshCcw,
  },
];

const settingsNavItem: NavItem = {
  title: "Settings",
  href: "/dashboard/settings",
  icon: Settings,
  // Settings is always visible
};

interface NavItemProps {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
  badge?: number;
}

function NavItemComponent({ item, isCollapsed, isActive, badge }: NavItemProps) {
  const Icon = item.icon;

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {badge && badge > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
            <span className="sr-only">{item.title}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-4">
          {item.title}
          {badge && badge > 0 && ` (${badge})`}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="flex-1">{item.title}</span>
      {badge && badge > 0 && (
        <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1 text-xs">
          {badge > 99 ? "99+" : badge}
        </Badge>
      )}
    </Link>
  );
}

function filterNavItems(items: NavItem[], enabledModules: ModuleId[]): NavItem[] {
  return items.filter((item) => {
    // Items without a module are always shown
    if (!item.module) return true;
    return enabledModules.includes(item.module);
  });
}

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const enabledModules = useEnabledModules();

  // Get urgent task count
  const { data: urgentCount } = api.tasks.getUrgentCount.useQuery(undefined, {
    refetchInterval: 60000, // Refetch every minute
  });

  // Get AI suggestions count
  const { data: suggestionsCount } = api.suggestions.getCount.useQuery(undefined, {
    refetchInterval: 60000, // Refetch every minute
  });

  // Filter nav items based on enabled modules
  const filteredMainNav = filterNavItems(mainNavItems, enabledModules);
  const filteredPlannerNav = filterNavItems(plannerNavItems, enabledModules);
  const filteredCaptureNav = filterNavItems(captureNavItems, enabledModules);
  const filteredGoalsNav = filterNavItems(goalsNavItems, enabledModules);
  const filteredCollaborateNav = filterNavItems(collaborateNavItems, enabledModules);

  // Check if sections have any items
  const showPlannerSection = filteredPlannerNav.length > 0;
  const showCaptureSection = filteredCaptureNav.length > 0;
  const showGoalsSection = filteredGoalsNav.length > 0;
  const showCollaborateSection = filteredCollaborateNav.length > 0;

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo/Brand */}
        <div className="flex h-14 items-center border-b px-4">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <span className="font-semibold">Filofax</span>
            </Link>
          )}
          {isCollapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground mx-auto">
              <LayoutDashboard className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {/* Main Navigation */}
            {filteredMainNav.map((item) => (
              <NavItemComponent
                key={item.href}
                item={item}
                isCollapsed={isCollapsed}
                isActive={pathname === item.href}
                badge={item.href === "/dashboard/tasks" ? urgentCount?.overdue : undefined}
              />
            ))}

            {/* Planner Section */}
            {showPlannerSection && (
              <>
                {!isCollapsed && (
                  <div className="mt-4 mb-2">
                    <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Planners
                    </span>
                  </div>
                )}
                {isCollapsed && <Separator className="my-4" />}
                {filteredPlannerNav.map((item) => (
                  <NavItemComponent
                    key={item.href}
                    item={item}
                    isCollapsed={isCollapsed}
                    isActive={pathname === item.href}
                  />
                ))}
              </>
            )}

            {/* Capture Section */}
            {showCaptureSection && (
              <>
                {!isCollapsed && (
                  <div className="mt-4 mb-2">
                    <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Capture
                    </span>
                  </div>
                )}
                {isCollapsed && <Separator className="my-4" />}
                {filteredCaptureNav.map((item) => (
                  <NavItemComponent
                    key={item.href}
                    item={item}
                    isCollapsed={isCollapsed}
                    isActive={pathname === item.href}
                  />
                ))}
              </>
            )}

            {/* Goals Section */}
            {showGoalsSection && (
              <>
                {!isCollapsed && (
                  <div className="mt-4 mb-2">
                    <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Goals
                    </span>
                  </div>
                )}
                {isCollapsed && <Separator className="my-4" />}
                {filteredGoalsNav.map((item) => (
                  <NavItemComponent
                    key={item.href}
                    item={item}
                    isCollapsed={isCollapsed}
                    isActive={pathname === item.href}
                  />
                ))}
              </>
            )}

            {/* Collaborate Section */}
            {showCollaborateSection && (
              <>
                {!isCollapsed && (
                  <div className="mt-4 mb-2">
                    <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Collaborate
                    </span>
                  </div>
                )}
                {isCollapsed && <Separator className="my-4" />}
                {filteredCollaborateNav.map((item) => (
                  <NavItemComponent
                    key={item.href}
                    item={item}
                    isCollapsed={isCollapsed}
                    isActive={pathname.startsWith(item.href)}
                  />
                ))}
              </>
            )}

            {/* Insights Section */}
            <>
              {!isCollapsed && (
                <div className="mt-4 mb-2">
                  <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Insights
                  </span>
                </div>
              )}
              {isCollapsed && <Separator className="my-4" />}
              {insightsNavItems.map((item) => (
                <NavItemComponent
                  key={item.href}
                  item={item}
                  isCollapsed={isCollapsed}
                  isActive={pathname === item.href}
                  badge={item.href === "/dashboard/suggestions" ? suggestionsCount : undefined}
                />
              ))}
            </>

            {/* Review Section */}
            <>
              {!isCollapsed && (
                <div className="mt-4 mb-2">
                  <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Review
                  </span>
                </div>
              )}
              {isCollapsed && <Separator className="my-4" />}
              {reviewNavItems.map((item) => (
                <NavItemComponent
                  key={item.href}
                  item={item}
                  isCollapsed={isCollapsed}
                  isActive={pathname === item.href}
                />
              ))}
            </>
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-3">
          <NavItemComponent
            item={settingsNavItem}
            isCollapsed={isCollapsed}
            isActive={pathname.startsWith("/dashboard/settings")}
          />

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "mt-2 w-full justify-center",
              isCollapsed && "w-9 h-9 p-0"
            )}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Collapse
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
