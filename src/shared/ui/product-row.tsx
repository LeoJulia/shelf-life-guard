"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { FieldLabel } from "@/shared/ui/field";

const valueClasses =
  "block w-full min-h-9 rounded-md bg-input px-3 py-1.5 md:min-h-8 md:text-sm dark:bg-input/30";

export const ProductValue = ({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) => (
  <span className={cn(valueClasses, className)} {...props}>
    {children}
  </span>
);

export const ProductRow = ({
  field,
  value,
  collapsable = false,
}: {
  field: string;
  value?: string | number | null;
  collapsable?: boolean;
}) => {
  const [open, setOpen] = useState(false);

  const text =
    value === null || value === undefined || value === "" ? "" : String(value);

  const canCollapse = collapsable && text !== "";

  if (!canCollapse) {
    return (
      <div className='flex items-center gap-2'>
        <FieldLabel>{field}</FieldLabel>
        <ProductValue>{text}</ProductValue>
      </div>
    );
  }

  return (
    <Collapsible
      className={cn("flex gap-2", open ? "items-start" : "items-center")}
      open={open}
      onOpenChange={setOpen}
    >
      <CollapsibleTrigger asChild>
        <FieldLabel
          className={cn(
            "cursor-pointer items-center",
            open && "pt-2 leading-5",
          )}
        >
          {field}
          <ChevronDown
            className={cn(
              "text-muted-foreground size-4 shrink-0 transition-transform",
              open && "rotate-180",
            )}
          />
        </FieldLabel>
      </CollapsibleTrigger>
      {open ? (
        <CollapsibleContent>
          <ProductValue className='whitespace-pre-wrap py-2'>
            {text}
          </ProductValue>
        </CollapsibleContent>
      ) : (
        <CollapsibleTrigger
          className={cn(valueClasses, "line-clamp-2 text-left")}
        >
          {text}
        </CollapsibleTrigger>
      )}
    </Collapsible>
  );
};
