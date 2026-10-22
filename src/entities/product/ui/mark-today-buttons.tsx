"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, PackageOpen, type LucideIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { toLocalDateString } from "@/shared/lib/local-date";
import {
  markTodayDescriptions,
  markTodayLabels,
  type TMarkTodayAction,
} from "../config/mark-today";
import { markProductDate } from "../api/mark-product-date";
import type { TProduct } from "../model";

const actionViews: Record<
  TMarkTodayAction,
  { Icon: LucideIcon; color: string }
> = {
  opened: { Icon: PackageOpen, color: "text-chart-4" },
  finished: { Icon: PackageCheck, color: "text-chart-3" },
};

const nextAction = (product: TProduct): TMarkTodayAction | null => {
  if (!product.opened_at) {
    return "opened";
  }

  return product.finished_at ? null : "finished";
};

export const MarkTodayButtons = ({ product }: { product: TProduct }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const action = nextAction(product);

  if (!action) {
    return null;
  }

  const { Icon, color } = actionViews[action];

  const handleMark = () => {
    setError(null);
    startTransition(async () => {
      try {
        await markProductDate(product.id, action, toLocalDateString());
        router.refresh();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Не удалось обновить дату продукта",
        );
      }
    });
  };

  return (
    <TooltipProvider>
      <div className='flex items-center gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              aria-label={markTodayLabels[action]}
              disabled={isPending}
              onClick={handleMark}
            >
              <Icon className={color} />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side='bottom'
            className='max-w-56 flex-col items-start'
          >
            <span className='font-medium'>{markTodayLabels[action]}</span>
            <span>{markTodayDescriptions[action]}</span>
          </TooltipContent>
        </Tooltip>
        {error && <span className='text-xs text-destructive'>{error}</span>}
      </div>
    </TooltipProvider>
  );
};
