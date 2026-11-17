"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "cn";

function Select<Value = string>({ ...props }: SelectPrimitive.Root.Props<Value>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="size-4 opacity-50 shrink-0" />
    </SelectPrimitive.Trigger>
  );
}

function SelectValue({ ...props }: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectContent({
  className,
  sideOffset = 4,
  align = "start",
  children,
  ...props
}: SelectPrimitive.Popup.Props & {
  sideOffset?: number;
  align?: "start" | "center" | "end";
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner sideOffset={sideOffset} align={align}>
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-lg border border-slate-200 bg-white p-1 text-slate-950 shadow-md outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50",
            className
          )}
          {...props}
        >
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 data-[highlighted]:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-50 dark:data-[highlighted]:bg-slate-800",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4 text-emerald-600" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
};
