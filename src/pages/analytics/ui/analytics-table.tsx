"use client";

import { useTable } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { TProduct } from "@/entities/product";
import { cn } from "@/shared/utils";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { features, PAGE_SIZE } from "../config/table";
import { columns } from "./columns";

export const AnalyticsTable = ({ products }: { products: TProduct[] }) => {
  const table = useTable({
    features,
    columns,
    data: products,
    getRowId: (product) => product.id,
    initialState: { pagination: { pageIndex: 0, pageSize: PAGE_SIZE } },
  });

  if (!products.length) {
    return (
      <p className='mt-6 text-sm text-muted-foreground'>
        Нет продуктов для аналитики
      </p>
    );
  }

  const { pageIndex } = table.state.pagination;
  const pageRows = table.getRowModel().rows;
  const totalRows = table.getRowCount();
  const firstRow = pageIndex * PAGE_SIZE + 1;

  return (
    <div className='mt-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-foreground'>
          Аналитика продуктов
        </h2>
        <span className='text-sm text-muted-foreground'>{totalRows} шт</span>
      </div>

      <Table className='mt-4'>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const column = header.column;
                const sorted = column.getIsSorted();
                const Icon =
                  !sorted || !column.getCanSort()
                    ? ArrowUpDown
                    : sorted === "desc"
                      ? ArrowDown
                      : ArrowUp;

                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "align-top whitespace-normal",
                      column.columnDef.meta?.wide
                        ? "min-w-72"
                        : column.columnDef.meta?.narrow
                          ? "text-right min-w-20"
                          : column.columnDef.meta?.numeric
                            ? "text-right min-w-24"
                            : "min-w-20",
                    )}
                  >
                    <button
                      type='button'
                      className={cn(
                        "inline-flex items-center gap-1 hover:text-foreground",
                        sorted ? "text-primary" : "text-muted-foreground",
                        column.columnDef.meta?.narrow &&
                          "max-w-24 [overflow-wrap:anywhere]",
                      )}
                      onClick={column.getToggleSortingHandler()}
                    >
                      <table.FlexRender header={header} />
                      <Icon
                        className={cn("size-3", !sorted && "opacity-40")}
                        aria-hidden
                      />
                    </button>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {pageRows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={
                    cell.column.columnDef.meta?.numeric
                      ? "text-right tabular-nums whitespace-nowrap"
                      : cell.column.columnDef.meta?.wide
                        ? "whitespace-normal max-w-96"
                        : "whitespace-normal max-w-64"
                  }
                >
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalRows > PAGE_SIZE ? (
        <div className='mt-4 flex items-center justify-between gap-4'>
          <span className='text-sm text-muted-foreground'>
            Показаны {firstRow}–{firstRow + pageRows.length - 1} из {totalRows}
          </span>

          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft className='size-4' />
              Назад
            </Button>
            <span className='text-sm text-muted-foreground'>
              Страница {pageIndex + 1} из {table.getPageCount()}
            </span>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Вперёд
              <ChevronRight className='size-4' />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
