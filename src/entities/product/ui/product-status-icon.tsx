"use client";

import {
  Package,
  PackageCheck,
  PackageOpen,
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { cn } from "@/shared/utils";
import {
  getProductStatus,
  productStatusLabels,
  type TProduct,
  type TProductStatus,
} from "../model";

const statusViews: Record<TProductStatus, { Icon: LucideIcon; color: string }> =
  {
    closed: { Icon: Package, color: "text-chart-5" },
    opened: { Icon: PackageOpen, color: "text-chart-4" },
    used: { Icon: PackageCheck, color: "text-chart-3" },
  };

export const ProductStatusIcon = ({ product }: { product: TProduct }) => {
  const status = getProductStatus(product);
  const { Icon, color } = statusViews[status];
  const label = productStatusLabels[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "flex size-7 cursor-help items-center justify-center rounded-full border border-border bg-card",
              color,
            )}
            aria-label={label}
          >
            <Icon className='size-4' />
          </span>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
