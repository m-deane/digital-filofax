"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import { MODULES, DEFAULT_ENABLED_MODULES, type ModuleId } from "@/lib/modules";
import { useEnabledModules, useToggleModule, useUpdateEnabledModules } from "@/hooks/use-modules";

export default function ModulesSettingsPage() {
  const enabledModules = useEnabledModules();
  const toggleModule = useToggleModule();
  const updateEnabledModules = useUpdateEnabledModules();

  const handleToggle = (moduleId: ModuleId, enabled: boolean) => {
    toggleModule.mutate({ moduleId, enabled });
  };

  const handleResetToDefaults = () => {
    updateEnabledModules.mutate({ enabledModules: DEFAULT_ENABLED_MODULES });
  };

  const isLoading = toggleModule.isPending || updateEnabledModules.isPending;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modules</h1>
          <p className="text-muted-foreground">
            Enable or disable features to customize your workspace
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleResetToDefaults}
          disabled={isLoading}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      {/* Module Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {Object.values(MODULES).map((module) => {
          const isEnabled = enabledModules.includes(module.id);
          const Icon = module.icon;

          return (
            <Card key={module.id} className={!isEnabled ? "opacity-60" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isEnabled ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`h-5 w-5 ${isEnabled ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{module.name}</CardTitle>
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleToggle(module.id, checked)}
                  disabled={isLoading}
                />
              </CardHeader>
              <CardContent>
                <CardDescription>{module.description}</CardDescription>
                <div className="mt-3 flex flex-wrap gap-1">
                  {module.routes.map((route) => (
                    <span
                      key={route}
                      className="text-xs bg-muted px-2 py-0.5 rounded"
                    >
                      {route.replace("/dashboard/", "/")}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            {!isLoading && (
              <p className="text-sm text-muted-foreground">
                Disabled modules will hide their navigation items and dashboard widgets.
                Your data is preserved and will reappear when you re-enable the module.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
