"use client";

import { Filter, Loader, Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { useState, useTransition } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils";

export const Control = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();

  const [showFilter, setShowFilter] = useState(false);

  const handleSearch = useDebouncedCallback((str: string) => {
    const params = new URLSearchParams(searchParams?.toString());

    startTransition(() => {
      if (str) {
        params.set("query", str);
      } else {
        params.delete("query");
      }

      replace(`${pathname}?${params.toString()}`);
    });
  }, 300);

  const handleShowFilter = () => {
    setShowFilter((showFilter) => !showFilter);
  };

  return (
    <div className='mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      <div className='relative flex-1 sm:max-w-md'>
        {isPending ? (
          <Loader className='absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground' />
        ) : (
          <Search className='absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground' />
        )}
        <input
          className='h-8 w-full pl-10 bg-background border border-border rounded-sm focus:bg-input focus:outline-border'
          placeholder='Ищи продукты, бренды или теги...'
          onChange={(e) => {
            handleSearch(e.target.value);
          }}
          defaultValue={searchParams?.get("query")?.toString()}
        />
      </div>

      <div className='flex items-center gap-2'>
        <Button
          variant='default'
          size='sm'
          className={cn(
            "rounded-sm gap-2 text-foreground border border-border",
            showFilter ? "bg-primary" : "bg-transparent",
          )}
          onClick={handleShowFilter}
        >
          <Filter className='size-5' />
          Фильтр
        </Button>
        {/* <Sort /> */}
      </div>

      {/* <SidebarFilter /> */}
    </div>
  );
};
