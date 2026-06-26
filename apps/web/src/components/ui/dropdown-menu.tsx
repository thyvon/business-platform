"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

function DropdownMenu({ ...props }: Menu.Root.Props) {
  return <Menu.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger({ className, ...props }: Menu.Trigger.Props) {
  return (
    <Menu.Trigger
      data-slot="dropdown-menu-trigger"
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/50 bg-white/55 text-muted-foreground shadow-sm backdrop-blur-xl transition-colors hover:bg-white/80 hover:text-foreground data-[popup-open]:bg-primary data-[popup-open]:text-primary-foreground dark:border-white/15 dark:bg-white/[0.08] dark:hover:bg-white/[0.16]",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuContent({ className, ...props }: Menu.Popup.Props) {
  return (
    <Menu.Portal>
      <Menu.Positioner sideOffset={4} align="end" className="z-50">
        <Menu.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "min-w-40 overflow-y-auto rounded-xl border border-white/50 bg-popover/90 p-1 text-sm leading-5 text-popover-foreground shadow-xl backdrop-blur-2xl outline-none dark:border-white/15 dark:bg-popover/92",
            className,
          )}
          {...props}
        />
      </Menu.Positioner>
    </Menu.Portal>
  );
}

function DropdownMenuItem({ className, ...props }: Menu.Item.Props) {
  return (
    <Menu.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm leading-5 outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };



