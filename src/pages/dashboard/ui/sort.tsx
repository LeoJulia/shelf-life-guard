import { ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

const sortGroups = [
  {
    label: "По цене",
    options: [
      { value: "actual_price_desc", label: "Сначала дороже" },
      { value: "actual_price_asc", label: "Сначала дешевле" },
    ],
  },
  {
    label: "По сроку",
    options: [
      { value: "expiry_date_asc", label: "Скоро истечет" },
      { value: "expiry_date_desc", label: "Дольше лежат" },
    ],
  },
  {
    label: "По дате добавления",
    options: [
      { value: "created_at_asc", label: "Сначала старые" },
      { value: "created_at_desc", label: "Сначала новые" },
    ],
  },
  {
    label: "По открытию",
    options: [
      { value: "opened_at_asc", label: "Открыты первыми" },
      { value: "opened_at_desc", label: "Открыты последними" },
    ],
  },
  {
    label: "По окончанию",
    options: [
      { value: "finished_at_asc", label: "Закончились первыми" },
      { value: "finished_at_desc", label: "Закончились последними" },
    ],
  },
];

export const Sort = ({
  onNavigate,
}: {
  onNavigate: (params: URLSearchParams) => void;
}) => {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const currentSort = searchParams?.get("sort");

  const handleSelect = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString());

    if (currentSort === value) {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }

    onNavigate(params);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='default'
          size='sm'
          className={cn(
            "relative rounded-sm gap-2 text-foreground border border-border",
            open ? "bg-primary" : "bg-transparent",
          )}
        >
          <ArrowUpDown className='size-5' />
          Сортировка
          {currentSort && (
            <span className='absolute -right-1 -top-1 size-2.5 rounded-full bg-primary ring-2 ring-background' />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='center' sideOffset={8} className='w-64'>
        <div className='flex flex-col gap-3'>
          {sortGroups.map((group) => (
            <div key={group.label} className='flex flex-col gap-1.5'>
              <span className='text-xs font-medium text-muted-foreground'>
                {group.label}
              </span>
              <div className='flex flex-col gap-1'>
                {group.options.map((option) => (
                  <Button
                    key={option.value}
                    type='button'
                    variant='ghost'
                    size='sm'
                    className={cn(
                      "justify-start font-normal",
                      currentSort === option.value &&
                        "bg-primary/10 font-medium text-foreground",
                    )}
                    onClick={() => handleSelect(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
