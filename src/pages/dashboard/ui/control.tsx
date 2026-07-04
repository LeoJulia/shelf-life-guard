"use client";

import { Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

export const Control = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((str: string) => {
    const params = new URLSearchParams(searchParams?.toString());

    if (str) {
      params.set("query", str);
    } else {
      params.delete("query");
    }

    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className='mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      <div className='relative flex-1 sm:max-w-md'>
        <Search className='absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground' />
        <input
          className='h-8 w-full pl-10 bg-background border border-border rounded-sm focus:bg-input focus:outline-border'
          placeholder='Ищи продукты, бренды или теги...'
          onChange={(e) => {
            handleSearch(e.target.value);
          }}
          defaultValue={searchParams?.get("query")?.toString()}
        />
      </div>
      {/* 
      <div class="flex items-center gap-2">
        <UButton
          variant="outline"
          size="sm"
          class="rounded-sm gap-2 text-foreground border-0.5 border-border"
          :class="showFilter ? 'bg-primary' : ''"
          @click="onShowFilter"
        >
          <UIcon name="mdi:filter-outline" class="size-5" />
          Фильтр
        </UButton>
        <Sort />
        <div
          class="ml-2 h-11 flex items-center rounded-sm border border-border bg-secondary/30 p-1"
        >
          <button
            @click="() => setViewMode('grid')"
            :class="[
              'h-8 rounded-sm p-1.5 transition-colors',
              viewMode === 'grid'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ]"
          >
            <UIcon name="mingcute:grid-line" class="size-5" />
          </button>
          <button
            @click="() => setViewMode('list')"
            :class="[
              'h-8 rounded-sm p-1.5 transition-colors',
              viewMode === 'list'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ]"
          >
            <UIcon name="ic:round-list" class="size-5" />
          </button>
        </div>
      </div> 
      */}

      {/* <SidebarFilter /> */}
    </div>
  );
};
