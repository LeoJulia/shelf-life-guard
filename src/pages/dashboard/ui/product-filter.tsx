import { Filter } from "lucide-react";
// import { useDebouncedCallback } from "use-debounce";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";

export const ProductFilter = () => {
  const [showFilter, setShowFilter] = useState(false);

  return (
    <Drawer direction='right' open={showFilter} onOpenChange={setShowFilter}>
      <DrawerTrigger asChild>
        <Button
          variant='default'
          size='sm'
          className={cn(
            "rounded-sm gap-2 text-foreground border border-border",
            showFilter ? "bg-primary" : "bg-transparent",
          )}
        >
          <Filter className='size-5' />
          Фильтр
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Фильтр</DrawerTitle>
          <DrawerDescription>Настрой свой поиск баночек</DrawerDescription>
        </DrawerHeader>
        {/* Filter form */}
        <DrawerFooter>
          <Button>Подтвердить</Button>
          <DrawerClose asChild>
            <Button variant='destructive'>Сбросить</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
