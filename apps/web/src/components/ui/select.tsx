"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown, X } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  name?: string;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  options: SelectOption[];
  placeholder?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
  popupClassName?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  clearable?: boolean;
}

export function Select({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder = "Select an option",
  disabled,
  required,
  className,
  triggerClassName,
  popupClassName,
  ariaLabel,
  ariaLabelledBy,
  clearable = false,
}: SelectProps) {
  const hasValue = value !== undefined && value !== null && value !== "";

  function clearSelection(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    onValueChange?.(null);
  }

  return (
    <SelectPrimitive.Root
      id={id}
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(nextValue) => onValueChange?.(nextValue)}
      disabled={disabled}
      required={required}
      items={options.map((option) => ({ value: option.value, label: option.label }))}
    >
      <div className={cn("relative w-full", className)}>
        <div className="relative">
          <SelectPrimitive.Trigger
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            className={cn(
              "relative flex h-8 w-full min-w-0 items-center rounded-xl border border-input bg-background/70 py-1 pl-2.5 pr-8 text-left font-sans text-sm font-normal leading-5 text-foreground shadow-sm backdrop-blur-xl outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 data-[placeholder]:text-muted-foreground dark:bg-input/30 dark:disabled:bg-input/80",
              triggerClassName,
            )}
          >
            <SelectPrimitive.Value placeholder={placeholder} className="flex min-w-0 flex-1 items-center truncate font-[inherit] text-[inherit] leading-[inherit]" />
            {clearable && hasValue ? null : (
              <SelectPrimitive.Icon className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center">
                <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
              </SelectPrimitive.Icon>
            )}
          </SelectPrimitive.Trigger>
          {clearable && hasValue && !disabled ? (
            <button
              type="button"
              onClick={clearSelection}
              className="absolute inset-y-0 right-0 flex w-8 items-center justify-center rounded-r-lg text-muted-foreground hover:text-foreground"
              aria-label="Clear selection"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner sideOffset={4} align="start" className="z-50">
            <SelectPrimitive.Popup
              className={cn(
                "max-h-72 min-w-[var(--anchor-width)] overflow-y-auto rounded-xl border border-white/50 bg-popover/90 p-1 text-popover-foreground shadow-xl backdrop-blur-2xl outline-none dark:border-white/15 dark:bg-popover/92",
                popupClassName,
              )}
            >
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="grid cursor-pointer grid-cols-[minmax(0,1fr)_1rem] items-center gap-2 rounded-lg px-2 py-1.5 font-sans text-sm font-normal leading-5 outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="justify-self-end">
                    <Check className="size-3.5" aria-hidden="true" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </div>
    </SelectPrimitive.Root>
  );
}




