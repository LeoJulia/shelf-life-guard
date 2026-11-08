"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils";

type TPaginationProps = {
  page: number;
  pageCount: number;
  total?: number;
  pageSize?: number;
  className?: string;
};

/**
 * Постраничная навигация через searchParams (?page=N). Сохраняет остальные
 * параметры (фильтры/сортировку/поиск). Страница 1 — без параметра в URL.
 * Сброс page при смене фильтра делает ProductSearch.navigate.
 */
export const Pagination = ({
  page,
  pageCount,
  total,
  pageSize,
  className,
}: TPaginationProps) => {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  if (pageCount <= 1) {
    return null;
  }

  const goTo = (next: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (next <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(next));
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const showRange =
    typeof total === "number" && typeof pageSize === "number" && pageSize > 0;
  const from = (page - 1) * (pageSize ?? 0) + 1;
  const to = Math.min(page * (pageSize ?? 0), total ?? 0);

  return (
    <div
      className={cn("mt-4 flex items-center justify-between gap-4", className)}
    >
      {showRange ? (
        <span className='text-sm text-muted-foreground'>
          Показаны {from}–{to} из {total}
        </span>
      ) : (
        <span />
      )}

      <div className='flex items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
        >
          <ChevronLeft className='size-4' />
          Назад
        </Button>
        <span className='text-sm text-muted-foreground'>
          Страница {page} из {pageCount}
        </span>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={page >= pageCount}
          onClick={() => goTo(page + 1)}
        >
          Вперёд
          <ChevronRight className='size-4' />
        </Button>
      </div>
    </div>
  );
};
