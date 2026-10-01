"use client";

import { Loader, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { TFilterOptions } from "@/entities/filter";
import { ProductFilter } from "./product-filter";

export const Control = ({
  filterOptions,
  isPending,
  onSearch,
  onNavigate,
}: {
  filterOptions: TFilterOptions;
  isPending: boolean;
  onSearch: (query: string) => void;
  onNavigate: (params: URLSearchParams) => void;
}) => {
  const searchParams = useSearchParams();

  return (
    <div className='mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      <div className='relative flex-1 sm:max-w-md'>
        {isPending ? (
          <Loader className='absolute left-3 top-1/2 size-5 -translate-y-1/2 animate-spin text-muted-foreground' />
        ) : (
          <Search className='absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground' />
        )}
        <input
          className='h-8 w-full pl-10 bg-background border border-border rounded-sm focus:bg-input focus:outline-border'
          placeholder='Ищи продукты, бренды или теги...'
          onChange={(e) => {
            onSearch(e.target.value);
          }}
          defaultValue={searchParams?.get("query")?.toString()}
        />
      </div>

      <div className='flex items-center gap-2'>
        <ProductFilter filterOptions={filterOptions} onNavigate={onNavigate} />
        {/* <Sort /> */}
      </div>

      {/* <SidebarFilter /> */}
    </div>
  );
};
