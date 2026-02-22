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
  ChevronDown,
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
  Image,
  GripVertical,
  Tag,
  LayoutGrid,
  Inbox,
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
import { useState, useEffect, useCallback, useMemo } from "react";
import { useEnabledModules, useSectionOrder, useUpdateSectionOrder } from "@/hooks/use-modules";
import type { ModuleId } from "@/lib/modules";
import { api } from "@/lib/trpc";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  module?: ModuleId;
}

interface NavSection {
  id: string;
  title: string;
  color: string; // Tailwind color class for the section tab
  items: NavItem[];
}

const mainNavItems: NavItem[] = [
  {
    title: "Inbox",
    href: "/dashboard/inbox",
    icon: Inbox,
  },
  {
    title: "Overview",
    href: "/dashboard/overview",
    icon: LayoutDashboard,
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
  {
    title: "Priority Matrix",
    href: "/dashboard/tasks/matrix",
    icon: LayoutGrid,
    module: "tasks",
  },
];

const DEFAULT_SECTIONS: NavSection[] = [
  {
    id: "planners",
    title: "Planners",
    color: "bg-blue-500",
    items: [
      { title: "Life Roles", href: "/dashboard/roles", icon: Compass, module: "planning" },
      { title: "Daily Planner", href: "/dashboard/daily", icon: CalendarClock, module: "calendar" },
      { title: "Weekly Planner", href: "/dashboard/planner/weekly", icon: Calendar, module: "calendar" },
      { title: "Monthly Planner", href: "/dashboard/planner/monthly", icon: CalendarDays, module: "calendar" },
    ],
  },
  {
    id: "capture",
    title: "Capture",
    color: "bg-emerald-500",
    items: [
      { title: "Habits", href: "/dashboard/habits", icon: Target, module: "habits" },
      { title: "Memos", href: "/dashboard/memos", icon: FileText, module: "memos" },
      { title: "Ideas", href: "/dashboard/ideas", icon: Lightbulb, module: "ideas" },
      { title: "Contacts", href: "/dashboard/contacts", icon: Users, module: "contacts" },
      { title: "Journal", href: "/dashboard/journal", icon: Heart, module: "journal" },
      { title: "Finance", href: "/dashboard/finance", icon: DollarSign, module: "finance" },
      { title: "GitHub", href: "/dashboard/github", icon: Github, module: "github" },
      { title: "Templates", href: "/dashboard/templates", icon: FileStack, module: "templates" },
      { title: "Tag Index", href: "/dashboard/tags", icon: Tag },
    ],
  },
  {
    id: "goals",
    title: "Goals",
    color: "bg-amber-500",
    items: [
      { title: "Goals", href: "/dashboard/goals", icon: Trophy, module: "goals" },
      { title: "Vision Board", href: "/dashboard/vision", icon: Image, module: "vision" },
      { title: "Contexts", href: "/dashboard/contexts", icon: AtSign, module: "tasks" },
      { title: "Someday/Maybe", href: "/dashboard/someday", icon: CloudOff, module: "someday" },
    ],
  },
  {
    id: "collaborate",
    title: "Collaborate",
    color: "bg-violet-500",
    items: [
      { title: "Shared Lists", href: "/dashboard/shared", icon: Share2, module: "collaboration" },
    ],
  },
  {
    id: "insights",
    title: "Insights",
    color: "bg-sky-500",
    items: [
      { title: "AI Suggestions", href: "/dashboard/suggestions", icon: Sparkles, module: "suggestions" },
      { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3, module: "analytics" },
    ],
  },
  {
    id: "review",
    title: "Review",
    color: "bg-rose-500",
    items: [
      { title: "Weekly Review", href: "/dashboard/review", icon: RefreshCcw, module: "planning" },
    ],
  },
];

const settingsNavItem: NavItem = {
  title: "Settings",
  href: "/dashboard/settings",
  icon: Settings,
};

const STORAGE_KEY = "filofax-sidebar-collapsed-sections";

function getStoredCollapsedSections(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function storeCollapsedSections(sections: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  } catch {
    // Ignore storage errors
  }
}

interface NavItemProps {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
  badge?: number;
  onNavigate?: () => void;
}

function NavItemComponent({ item, isCollapsed, isActive, badge, onNavigate }: NavItemProps) {
  const Icon = item.icon;

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            onClick={onNavigate}
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
      onClick={onNavigate}
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
    if (!item.module) return true;
    return enabledModules.includes(item.module);
  });
}

function SortableSectionWrapper({
  id,
  disabled,
  renderContent,
}: {
  id: string;
  disabled: boolean;
  renderContent: (dragHandleProps: Record<string, unknown>) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-50 z-50")}
      {...attributes}
    >
      {renderContent((listeners ?? {}) as Record<string, unknown>)}
    </div>
  );
}

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const enabledModules = useEnabledModules();
  const savedSectionOrder = useSectionOrder();
  const updateSectionOrder = useUpdateSectionOrder();

  // Load collapsed sections from localStorage on mount
  useEffect(() => {
    setCollapsedSections(getStoredCollapsedSections());
  }, []);

  // Get urgent task count
  const { data: urgentCount } = api.tasks.getUrgentCount.useQuery(undefined, {
    refetchInterval: 60000,
  });

  // Get inbox unprocessed count
  const { data: inboxCount } = api.inbox.getCount.useQuery(undefined, {
    refetchInterval: 60000,
  });

  // Get AI suggestions count
  const { data: suggestionsCount } = api.suggestions.getCount.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId];
      storeCollapsedSections(next);
      return next;
    });
  }, []);

  // Check if any item in a section is active (to auto-expand its section)
  const isSectionActive = useCallback(
    (section: NavSection) => {
      return section.items.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + "/")
      );
    },
    [pathname]
  );

  const isSectionExpanded = useCallback(
    (section: NavSection) => {
      // Always expand if section contains the active route
      if (isSectionActive(section)) return true;
      // Otherwise respect the user's collapsed preference
      return !collapsedSections.includes(section.id);
    },
    [collapsedSections, isSectionActive]
  );

  // Order sections based on saved preference
  const orderedSections = useMemo(() => {
    const filtered = DEFAULT_SECTIONS.map((section) => ({
      ...section,
      items: filterNavItems(section.items, enabledModules),
    })).filter((section) => section.items.length > 0);

    if (!savedSectionOrder || savedSectionOrder.length === 0) {
      return filtered;
    }

    // Sort by saved order, putting unknown sections at the end
    const orderMap = new Map(savedSectionOrder.map((id, index) => [id, index]));
    return [...filtered].sort((a, b) => {
      const aIndex = orderMap.get(a.id) ?? 999;
      const bIndex = orderMap.get(b.id) ?? 999;
      return aIndex - bIndex;
    });
  }, [enabledModules, savedSectionOrder]);

  const filteredMainNav = filterNavItems(mainNavItems, enabledModules);

  const getBadge = (href: string): number | undefined => {
    if (href === "/dashboard/inbox") return inboxCount;
    if (href === "/dashboard/tasks") return urgentCount?.overdue;
    if (href === "/dashboard/suggestions") return suggestionsCount;
    return undefined;
  };

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = orderedSections.findIndex((s) => s.id === active.id);
      const newIndex = orderedSections.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(orderedSections, oldIndex, newIndex);
      updateSectionOrder.mutate({
        sectionOrder: newOrder.map((s) => s.id),
      });
    },
    [orderedSections, updateSectionOrder]
  );

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
            <Link href="/dashboard/daily" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <span className="font-semibold">Filofax</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/dashboard/daily" className="mx-auto">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutDashboard className="h-5 w-5" />
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {/* Main Navigation (no section header) */}
            {filteredMainNav.map((item) => (
              <NavItemComponent
                key={item.href}
                item={item}
                isCollapsed={isCollapsed}
                isActive={pathname === item.href}
                badge={getBadge(item.href)}
                onNavigate={onNavigate}
              />
            ))}

            {/* Collapsible Sections with Colored Tabs + Drag-and-Drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedSections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {orderedSections.map((section) => {
                  const expanded = isSectionExpanded(section);
                  const active = isSectionActive(section);

                  return (
                    <SortableSectionWrapper
                      key={section.id}
                      id={section.id}
                      disabled={isCollapsed}
                      renderContent={(dragHandleProps) => (
                        <>
                          {isCollapsed ? (
                            <>
                              <Separator className="my-3" />
                              {/* Show colored dot when collapsed */}
                              <div className="flex justify-center mb-1">
                                <div className={cn("h-1.5 w-6 rounded-full", section.color, active && "opacity-100", !active && "opacity-40")} />
                              </div>
                              {section.items.map((item) => (
                                <NavItemComponent
                                  key={item.href}
                                  item={item}
                                  isCollapsed={isCollapsed}
                                  isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                                  badge={getBadge(item.href)}
                                  onNavigate={onNavigate}
                                />
                              ))}
                            </>
                          ) : (
                            <>
                              {/* Section header with colored tab + drag handle */}
                              <div
                                className={cn(
                                  "mt-4 mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/50",
                                  "border-l-[3px]",
                                  active ? section.color : "border-l-transparent"
                                )}
                                style={{
                                  borderLeftColor: active ? undefined : "transparent",
                                }}
                              >
                                {/* Drag handle */}
                                <div
                                  className="cursor-grab active:cursor-grabbing touch-none"
                                  {...dragHandleProps}
                                >
                                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-muted-foreground" />
                                </div>

                                {/* Toggle button */}
                                <button
                                  onClick={() => toggleSection(section.id)}
                                  className="flex flex-1 items-center gap-2"
                                >
                                  <div className={cn("h-2 w-2 rounded-full", section.color)} />
                                  <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">
                                    {section.title}
                                  </span>
                                  <ChevronDown
                                    className={cn(
                                      "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                                      !expanded && "-rotate-90"
                                    )}
                                  />
                                </button>
                              </div>

                              {/* Section items with colored left border */}
                              {expanded && (
                                <div className={cn("ml-1 border-l-2 pl-1", section.color.replace("bg-", "border-"))}>
                                  {section.items.map((item) => (
                                    <NavItemComponent
                                      key={item.href}
                                      item={item}
                                      isCollapsed={isCollapsed}
                                      isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                                      badge={getBadge(item.href)}
                                      onNavigate={onNavigate}
                                    />
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-3">
          <NavItemComponent
            item={settingsNavItem}
            isCollapsed={isCollapsed}
            isActive={pathname.startsWith("/dashboard/settings")}
            onNavigate={onNavigate}
          />

          {/* Collapse Toggle - desktop only */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "mt-2 w-full justify-center hidden md:flex",
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
