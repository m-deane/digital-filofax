"use client";

import { api } from "@/lib/trpc";
import { DEFAULT_ENABLED_MODULES, isRouteEnabled, isWidgetEnabled, type ModuleId } from "@/lib/modules";

export function usePreferences() {
  return api.preferences.get.useQuery();
}

export function useEnabledModules(): ModuleId[] {
  const { data: prefs } = usePreferences();
  return (prefs?.enabledModules ?? DEFAULT_ENABLED_MODULES) as ModuleId[];
}

export function useIsModuleEnabled(moduleId: ModuleId): boolean {
  const enabledModules = useEnabledModules();
  return enabledModules.includes(moduleId);
}

export function useIsRouteEnabled(route: string): boolean {
  const enabledModules = useEnabledModules();
  return isRouteEnabled(route, enabledModules);
}

export function useIsWidgetEnabled(widgetType: string): boolean {
  const enabledModules = useEnabledModules();
  return isWidgetEnabled(widgetType, enabledModules);
}

export function useToggleModule() {
  const utils = api.useUtils();

  return api.preferences.toggleModule.useMutation({
    onSuccess: () => {
      utils.preferences.get.invalidate();
    },
  });
}

export function useUpdateEnabledModules() {
  const utils = api.useUtils();

  return api.preferences.updateEnabledModules.useMutation({
    onSuccess: () => {
      utils.preferences.get.invalidate();
    },
  });
}
