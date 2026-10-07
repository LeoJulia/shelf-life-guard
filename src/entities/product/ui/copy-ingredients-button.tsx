"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { TProduct } from "../model";

export const CopyIngredientsButton = ({
  product,
  className,
}: {
  product: TProduct;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleCopy = async () => {
    if (!product.ingredients) return;

    await navigator.clipboard.writeText(
      `${product.brand} - ${product.name}\nСостав: ${product.ingredients}`,
    );
    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            aria-label='Скопировать состав'
            disabled={!product.ingredients}
            className={cn(
              "absolute top-3 right-3 z-10 bg-card/80 text-muted-foreground",
              className,
            )}
            onClick={handleCopy}
          >
            {copied ? <Check className='text-green-600' /> : <Copy />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side='left'>Копировать состав</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
