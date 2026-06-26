"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { Check, X } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface MultiComboboxProps {
  id?: string;
  name?: string;
  value: string[];
  onValueChange: (value: string[]) => void;
  options: ComboboxOption[];
  placeholder?: string;
  emptyText?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  popupClassName?: string;
  chipClassName?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  maxVisibleValues?: number;
}

interface ComboboxItemValue {
  value: string;
  label: string;
  option: ComboboxOption;
}

function getOptionText(label: React.ReactNode): string {
  return typeof label === "string" || typeof label === "number" ? String(label) : "";
}

function toItem(option: ComboboxOption): ComboboxItemValue {
  return {
    value: option.value,
    label: getOptionText(option.label),
    option,
  };
}

export function MultiCombobox({
  id,
  name,
  value,
  onValueChange,
  options,
  placeholder = "Select options",
  emptyText = "No options found",
  disabled,
  className,
  inputClassName,
  popupClassName,
  chipClassName,
  ariaLabel,
  ariaLabelledBy,
  maxVisibleValues = 2,
}: MultiComboboxProps) {
  const items = React.useMemo(() => options.map(toItem), [options]);
  const selectedItems = React.useMemo(
    () => items.filter((item) => value.includes(item.value)),
    [items, value],
  );

  const hiddenInputs = name ? value.map((selectedValue) => (
    <input key={selectedValue} type="hidden" name={name} value={selectedValue} />
  )) : null;

  function handleValueChange(nextItems: ComboboxItemValue[]) {
    onValueChange(nextItems.map((item) => item.value));
  }

  return (
    <ComboboxPrimitive.Root<ComboboxItemValue, true>
      multiple
      value={selectedItems}
      onValueChange={handleValueChange}
      items={items}
      itemToStringValue={(item) => item.value}
      itemToStringLabel={(item) => item.label}
      isItemEqualToValue={(item, selectedItem) => item.value === selectedItem.value}
      disabled={disabled}
      autoHighlight
    >
      <div className={cn("relative w-full", className)}>
        {hiddenInputs}
        <ComboboxPrimitive.Chips
          className={cn(
            "flex min-h-8 w-full min-w-0 flex-nowrap items-center gap-1 overflow-x-hidden rounded-xl bg-background/70 px-2 py-1 shadow-sm backdrop-blur-xl font-sans text-sm font-normal leading-5 text-foreground outline-none transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:bg-input/50 data-[disabled]:opacity-50 dark:bg-input/30 dark:data-[disabled]:bg-input/80",
            inputClassName,
          )}
        >
          <ComboboxPrimitive.Value>
            {(selectedValue) => {
              const selected = Array.isArray(selectedValue) ? selectedValue as ComboboxItemValue[] : [];
              const visible = selected.slice(0, maxVisibleValues);
              const hiddenCount = Math.max(0, selected.length - visible.length);

              return (
                <>
                  {visible.map((item) => (
                    <ComboboxPrimitive.Chip
                      key={item.value}
                      className={cn(
                        "inline-flex max-w-[10rem] shrink-0 items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium leading-4 text-secondary-foreground",
                        chipClassName,
                      )}
                    >
                      <span className="min-w-0 truncate">{item.option.label}</span>
                      <ComboboxPrimitive.ChipRemove
                        aria-label={`Remove ${item.label || item.value}`}
                        className="flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <X className="size-3" aria-hidden="true" />
                      </ComboboxPrimitive.ChipRemove>
                    </ComboboxPrimitive.Chip>
                  ))}
                  {hiddenCount > 0 ? (
                    <span className="inline-flex shrink-0 items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium leading-4 text-muted-foreground">
                      +{hiddenCount}
                    </span>
                  ) : null}
                </>
              );
            }}
          </ComboboxPrimitive.Value>
          <ComboboxPrimitive.Input
            id={id}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            placeholder={selectedItems.length === 0 ? placeholder : ""}
            className="h-6 min-w-[8rem] flex-1 shrink-0 bg-transparent px-0.5 font-sans text-sm font-normal leading-5 outline-none placeholder:font-normal placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
        </ComboboxPrimitive.Chips>
        <ComboboxPrimitive.Portal>
          <ComboboxPrimitive.Positioner sideOffset={4} align="start" className="z-50">
            <ComboboxPrimitive.Popup
              className={cn(
                "group max-h-72 min-w-[var(--anchor-width)] overflow-y-auto rounded-xl border border-white/30 bg-popover/90 p-1 text-popover-foreground shadow-xl backdrop-blur-2xl outline-none dark:border-white/10 dark:bg-popover/92",
                popupClassName,
              )}
            >
              <ComboboxPrimitive.Empty className="hidden px-2 py-4 text-center text-sm leading-5 text-muted-foreground group-data-[empty]:block">
                {emptyText}
              </ComboboxPrimitive.Empty>
              <ComboboxPrimitive.List>
                {(item: ComboboxItemValue, index: number) => (
                  <ComboboxPrimitive.Item
                    key={item.value}
                    value={item}
                    index={index}
                    disabled={item.option.disabled}
                    className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_1rem] items-center gap-2 rounded-lg px-2 py-1.5 font-sans text-sm font-normal leading-5 outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                  >
                    <span className="min-w-0 whitespace-normal break-normal leading-5">{item.option.label}</span>
                    <ComboboxPrimitive.ItemIndicator className="justify-self-end">
                      <Check className="size-3.5" aria-hidden="true" />
                    </ComboboxPrimitive.ItemIndicator>
                  </ComboboxPrimitive.Item>
                )}
              </ComboboxPrimitive.List>
            </ComboboxPrimitive.Popup>
          </ComboboxPrimitive.Positioner>
        </ComboboxPrimitive.Portal>
      </div>
    </ComboboxPrimitive.Root>
  );
}







export interface ComboboxProps {
  id?: string;
  name?: string;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  options: ComboboxOption[];
  placeholder?: string;
  emptyText?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  popupClassName?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  clearable?: boolean;
}

export function Combobox({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder = "Select an option",
  emptyText = "No options found",
  disabled,
  required,
  className,
  inputClassName,
  popupClassName,
  ariaLabel,
  ariaLabelledBy,
  clearable = true,
}: ComboboxProps) {
  const items = React.useMemo(() => options.map(toItem), [options]);
  const selectedItem = React.useMemo(
    () => items.find((item) => item.value === value) ?? null,
    [items, value],
  );
  const defaultItem = React.useMemo(
    () => items.find((item) => item.value === defaultValue) ?? null,
    [defaultValue, items],
  );

  return (
    <ComboboxPrimitive.Root<ComboboxItemValue>
      value={value !== undefined ? selectedItem : undefined}
      defaultValue={defaultValue !== undefined ? defaultItem : undefined}
      onValueChange={(nextItem) => onValueChange?.(nextItem?.value ?? null)}
      items={items}
      itemToStringValue={(item) => item.value}
      itemToStringLabel={(item) => item.label}
      isItemEqualToValue={(item, selected) => item.value === selected.value}
      disabled={disabled}
      name={name}
      required={required}
      autoHighlight
    >
      <div className={cn("relative w-full", className)}>
        <div className="relative">
          <ComboboxPrimitive.Input
            id={id}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            placeholder={placeholder}
            className={cn(
              "h-8 w-full min-w-0 rounded-xl bg-background/70 py-1 pl-2.5 pr-8 shadow-sm backdrop-blur-xl font-sans text-sm font-normal leading-5 text-foreground outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30 dark:disabled:bg-input/80",
              inputClassName,
            )}
          />
          {clearable && selectedItem && !disabled ? (
            <button
              type="button"
              onClick={() => onValueChange?.(null)}
              className="absolute inset-y-0 right-0 flex w-8 items-center justify-center rounded-r-lg text-muted-foreground hover:text-foreground"
              aria-label="Clear selection"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <ComboboxPrimitive.Portal>
          <ComboboxPrimitive.Positioner sideOffset={4} align="start" className="z-50">
            <ComboboxPrimitive.Popup
              className={cn(
                "group max-h-72 min-w-[var(--anchor-width)] overflow-y-auto rounded-xl border border-white/30 bg-popover/90 p-1 text-popover-foreground shadow-xl backdrop-blur-2xl outline-none dark:border-white/10 dark:bg-popover/92",
                popupClassName,
              )}
            >
              <ComboboxPrimitive.Empty className="hidden px-2 py-4 text-center text-sm leading-5 text-muted-foreground group-data-[empty]:block">
                {emptyText}
              </ComboboxPrimitive.Empty>
              <ComboboxPrimitive.List>
                {(item: ComboboxItemValue, index: number) => (
                  <ComboboxPrimitive.Item
                    key={item.value}
                    value={item}
                    index={index}
                    disabled={item.option.disabled}
                    className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_1rem] items-center gap-2 rounded-lg px-2 py-1.5 font-sans text-sm font-normal leading-5 outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                  >
                    <span className="min-w-0 whitespace-normal break-normal leading-5">{item.option.label}</span>
                    <ComboboxPrimitive.ItemIndicator className="justify-self-end">
                      <Check className="size-3.5" aria-hidden="true" />
                    </ComboboxPrimitive.ItemIndicator>
                  </ComboboxPrimitive.Item>
                )}
              </ComboboxPrimitive.List>
            </ComboboxPrimitive.Popup>
          </ComboboxPrimitive.Positioner>
        </ComboboxPrimitive.Portal>
      </div>
    </ComboboxPrimitive.Root>
  );
}




