"use client";

import { useCallback } from "react";
import { Check } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface Permission {
  id: string;
  key: string;
  module: string;
  description: string;
}

interface PermissionMatrixEditorProps {
  permissions: Permission[];
  selected: string[];
  onSelectionChange: (keys: string[]) => void;
}

export function PermissionMatrixEditor({
  permissions,
  selected,
  onSelectionChange,
}: PermissionMatrixEditorProps) {
  const grouped = groupByModule(permissions);

  const toggleAllModule = useCallback((module: string, modulePermissions: Permission[]) => {
    const moduleKeys = modulePermissions.map((p) => p.key);
    const allSelected = moduleKeys.every((k) => selected.includes(k));
    if (allSelected) {
      onSelectionChange(selected.filter((k) => !moduleKeys.includes(k)));
    } else {
      const existing = selected.filter((k) => !moduleKeys.includes(k));
      onSelectionChange([...existing, ...moduleKeys]);
    }
  }, [selected, onSelectionChange]);

  const toggleOne = useCallback((key: string) => {
    if (selected.includes(key)) {
      onSelectionChange(selected.filter((k) => k !== key));
    } else {
      onSelectionChange([...selected, key]);
    }
  }, [selected, onSelectionChange]);

  const moduleNames = Object.keys(grouped).sort();
  const allKeys = permissions.map((p) => p.key);
  const allSelected = allKeys.every((k) => selected.includes(k));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelectionChange(allSelected ? [] : [...allKeys])}
          className={cn(
            "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
            allSelected
              ? "border-primary bg-primary/10 text-primary"
              : "border-input text-muted-foreground hover:border-muted-foreground",
          )}
        >
          <div className={cn(
            "flex size-3.5 items-center justify-center rounded-sm border",
            allSelected ? "border-primary bg-primary text-primary-foreground" : "border-input",
          )}>
            {allSelected && <Check className="size-3" />}
          </div>
          Select all
        </button>
        {selected.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {selected.length} of {allKeys.length} selected
          </span>
        )}
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {moduleNames.map((module) => {
          const modulePermissions = grouped[module];
          const moduleKeys = modulePermissions.map((p) => p.key);
          const moduleSelected = moduleKeys.filter((k) => selected.includes(k)).length;
          const moduleAllSelected = moduleSelected === moduleKeys.length;
          const modulePartialSelected = moduleSelected > 0 && !moduleAllSelected;

          return (
            <div key={module} className="rounded-lg border border-border">
              <button
                type="button"
                onClick={() => toggleAllModule(module, modulePermissions)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-t-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  moduleAllSelected
                    ? "bg-primary/5 text-primary"
                    : "bg-muted/30 text-foreground hover:bg-muted/50",
                )}
              >
                <div className={cn(
                  "flex size-4 items-center justify-center rounded-sm border transition-colors",
                  moduleAllSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : modulePartialSelected
                      ? "border-primary/50 bg-primary/20 text-primary"
                      : "border-input",
                )}>
                  {(moduleAllSelected || modulePartialSelected) && <Check className="size-3" />}
                </div>
                {module}
                <span className="ml-auto text-xs text-muted-foreground">
                  {moduleSelected}/{moduleKeys.length}
                </span>
              </button>
              {modulePermissions.map((perm) => (
                <button
                  key={perm.id}
                  type="button"
                  onClick={() => toggleOne(perm.key)}
                  className={cn(
                    "flex w-full items-center gap-2 border-t border-border px-3 py-2 pl-8 text-left text-sm transition-colors",
                    selected.includes(perm.key)
                      ? "bg-primary/5 text-foreground"
                      : "text-muted-foreground hover:bg-muted/20",
                  )}
                >
                  <div className={cn(
                    "flex size-4 items-center justify-center rounded-sm border transition-colors",
                    selected.includes(perm.key)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input",
                  )}>
                    {selected.includes(perm.key) && <Check className="size-3" />}
                  </div>
                  <div>
                    <span>{perm.key.split(".").pop()}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{perm.description}</span>
                  </div>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function groupByModule(permissions: Permission[]) {
  const grouped: Record<string, Permission[]> = {};
  for (const perm of permissions) {
    if (!grouped[perm.module]) grouped[perm.module] = [];
    grouped[perm.module].push(perm);
  }
  return grouped;
}

