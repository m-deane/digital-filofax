"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  CalendarDays,
  Target,
  FileText,
  Lightbulb,
  Settings,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tasks",
    href: "/dashboard/tasks",
    icon: CheckSquare,
  },
  {
    title: "Weekly Tasks",
    href: "/dashboard/weekly",
    icon: FolderKanban,
  },
  {
    title: "Monthly Tasks",
    href: "/dashboard/monthly",
    icon: CalendarRange,
  },
];

const plannerNavItems = [
  {
    title: "Weekly Planner",
    href: "/dashboard/planner/weekly",
    icon: Calendar,
  },
  {
    title: "Monthly Planner",
    href: "/dashboard/planner/monthly",
    icon: CalendarDays,
  },
];

const otherNavItems = [
  {
    title: "Habits",
    href: "/dashboard/habits",
    icon: Target,
  },
  {
    title: "Memos",
    href: "/dashboard/memos",
    icon: FileText,
  },
  {
    title: "Ideas",
    href: "/dashboard/ideas",
    icon: Lightbulb,
  },
];

const settingsNavItem = {
  title: "Settings",
  href: "/dashboard/settings",
  icon: Settings,
};

interface NavItemProps {
  item: {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  isCollapsed: boolean;
  isActive: boolean;
}

function NavItem({ item, isCollapsed, isActive }: NavItemProps) {
  const Icon = item.icon;

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="sr-only">{item.title}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-4">
          {item.title}
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
      {item.title}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
            {mainNavItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                isCollapsed={isCollapsed}
                isActive={pathname === item.href}
              />
            ))}

            {/* Planner Section */}
            {!isCollapsed && (
              <div className="mt-4 mb-2">
                <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Planners
                </span>
              </div>
            )}
            {isCollapsed && <Separator className="my-4" />}
            {plannerNavItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                isCollapsed={isCollapsed}
                isActive={pathname === item.href}
              />
            ))}

            {/* Other Section */}
            {!isCollapsed && (
              <div className="mt-4 mb-2">
                <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Capture
                </span>
              </div>
            )}
            {isCollapsed && <Separator className="my-4" />}
            {otherNavItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                isCollapsed={isCollapsed}
                isActive={pathname === item.href}
              />
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-3">
          <NavItem
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
