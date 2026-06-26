"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import { Check, ChevronDown, Search, X } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface MultiSelectProps {
  id?: string;
  name?: string;
  value: string[];
  onValueChange: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  popupClassName?: string;
  maxVisibleValues?: number;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  searchable?: boolean;
}

function getOptionText(label: React.ReactNode): string {
  return typeof label === "string" || typeof label === "number" ? String(label) : "";
}

export function MultiSelect({
  id,
  name,
  value,
  onValueChange,
  options,
  placeholder = "Select options",
  disabled,
  className,
  triggerClassName,
  popupClassName,
  maxVisibleValues = 2,
  ariaLabel,
  ariaLabelledBy,
  searchable = false,
}: MultiSelectProps) {
  const [search, setSearch] = React.useState("");

  const filtered = searchable && search.trim()
    ? options.filter((opt) => {
        const text = getOptionText(opt.label).toLowerCase();
        return text.includes(search.trim().toLowerCase());
      })
    : options;

  const selectedOptions = options.filter((option) => value.includes(option.value));
  const selectedLabels = selectedOptions.map((option) => option.label);
  const hiddenInputs = name ? value.map((selectedValue) => (
    <input key={selectedValue} type="hidden" name={name} value={selectedValue} />
  )) : null;

  function setOptionChecked(optionValue: string, checked: boolean) {
    const nextValue = checked
      ? [...value, optionValue]
      : value.filter((selectedValue) => selectedValue !== optionValue);
    onValueChange(Array.from(new Set(nextValue)));
  }

  function clearSelection(event: React.MouseEvent) {
    event.stopPropagation();
    onValueChange([]);
  }

  return (
    <Menu.Root disabled={disabled} modal={false}>
      <div className={cn("relative w-full", className)}>
        {hiddenInputs}
        <Menu.Trigger
          id={id}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          disabled={disabled}
          className={cn(
            "flex min-h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg bg-background px-2.5 py-1 text-left font-sans text-sm font-normal leading-5 text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30 dark:disabled:bg-input/80",
            triggerClassName,
          )}
        >
          <span className={cn("min-w-0 flex-1", selectedOptions.length === 0 && "text-muted-foreground")}>
            {selectedOptions.length === 0 ? placeholder : (
              <>
                {selectedLabels.slice(0, maxVisibleValues).map((label, index) => (
                  <React.Fragment key={String(index)}>
                    {index > 0 ? ", " : null}{label}
                  </React.Fragment>
                ))}
                {selectedLabels.length > maxVisibleValues ? ` +${selectedLabels.length - maxVisibleValues}` : null}
              </>
            )}
          </span>
          {selectedOptions.length > 0 && !disabled ? (
            <div
              role="button"
              tabIndex={0}
              onClick={clearSelection}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); clearSelection(e as unknown as React.MouseEvent<HTMLButtonElement>); } }}
              className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              aria-label="Clear selected options"
            >
              <X className="size-3.5" aria-hidden="true" />
            </div>
          ) : null}
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={4} align="start" className="z-50">
            <Menu.Popup
              className={cn(
                "max-h-72 min-w-[var(--anchor-width)] overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-lg outline-none",
                popupClassName,
              )}
            >
              {searchable && (
                <div className="sticky top-0 z-10 bg-popover px-2 pb-1 pt-1">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search roles..."
                      className=                      "w-full rounded-md bg-muted/50 py-1.5 pl-8 pr-2.5 font-sans text-sm font-normal leading-5 text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}
              {filtered.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm leading-5 text-muted-foreground">No options found</div>
              ) : (
                filtered.map((option) => {
                  const checked = value.includes(option.value);
                  return (
                    <Menu.CheckboxItem
                      key={option.value}
                      checked={checked}
                      onCheckedChange={(nextChecked) => setOptionChecked(option.value, nextChecked)}
                      disabled={option.disabled}
                      closeOnClick={false}
                      label={getOptionText(option.label)}
                      className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-md px-2 py-1.5 font-sans text-sm font-normal leading-5 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                    >
                      <Menu.CheckboxItemIndicator>
                        <Check className="size-3.5" aria-hidden="true" />
                      </Menu.CheckboxItemIndicator>
                      <span>{option.label}</span>
                    </Menu.CheckboxItem>
                  );
                })
              )}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </div>
    </Menu.Root>
  );
}



