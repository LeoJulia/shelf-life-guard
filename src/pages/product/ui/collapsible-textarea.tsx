"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils";
import { Textarea } from "@/shared/ui/textarea";

export const CollapsibleTextarea = ({
  id,
  name,
  defaultValue,
}: {
  id: string;
  name: string;
  defaultValue?: string | null;
}) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(defaultValue ?? "");

  return (
    <div className='flex w-full flex-col gap-1'>
      <Textarea
        id={id}
        name={name}
        defaultValue={defaultValue ?? undefined}
        className={cn(!open && "hidden")}
        onChange={(e) => setText(e.target.value)}
      />
      {!open && (
        <button
          type='button'
          onClick={() => setOpen(true)}
          className='min-h-[38px] rounded-lg border border-input bg-input px-2.5 py-2 text-left text-sm text-muted-foreground dark:bg-input/30'
        >
          <span className='line-clamp-2 max-h-10 overflow-hidden leading-5'>
            {text}
          </span>
        </button>
      )}
      <button
        type='button'
        onClick={() => setOpen((prev) => !prev)}
        className='text-muted-foreground hover:text-foreground flex items-center gap-1 self-start text-xs'
      >
        {open ? "Свернуть" : "Развернуть"}
        <ChevronDown
          className={cn("size-3 transition-transform", open && "rotate-180")}
        />
      </button>
    </div>
  );
};
