import { Filter } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field";
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
import { Combobox } from "@/shared/ui/combobox";
import { Slider } from "@/shared/ui/slider";
import { Switch } from "@/shared/ui/switch";
import type { TFilterOptions } from "@/entities/filter";

const statusFilters = [
  { id: "opened", label: "Открытые баночки" },
  { id: "closed", label: "Закрытые баночки" },
  { id: "finished", label: "Законченные баночки" },
  { id: "expiringSoon", label: "Срок меньше 30 дней" },
  { id: "expiring", label: "Срок меньше 90 дней" },
];

type TListKey = "brand" | "category" | "shop";

const readList = (params: URLSearchParams, key: TListKey) =>
  params.getAll(key).filter(Boolean);

const readStatus = (params: URLSearchParams) =>
  Object.fromEntries(
    statusFilters.map(({ id }) => [id, params.get(id) === "1"]),
  ) as Record<string, boolean>;

const readPriceRange = (
  params: URLSearchParams,
  bounds: [number, number],
): [number, number] => [
  Number(params.get("price_min") ?? bounds[0]),
  Number(params.get("price_max") ?? bounds[1]),
];

export const ProductFilter = ({
  filterOptions,
}: {
  filterOptions: TFilterOptions;
}) => {
  const { priceRange: priceBounds } = filterOptions;
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const currentParams = new URLSearchParams(searchParams?.toString());

  const [showFilter, setShowFilter] = useState(false);
  const [brands, setBrands] = useState<string[]>(() =>
    readList(currentParams, "brand"),
  );
  const [categories, setCategories] = useState<string[]>(() =>
    readList(currentParams, "category"),
  );
  const [shops, setShops] = useState<string[]>(() =>
    readList(currentParams, "shop"),
  );
  const [priceRange, setPriceRange] = useState<[number, number]>(() =>
    readPriceRange(currentParams, priceBounds),
  );
  const [status, setStatus] = useState<Record<string, boolean>>(() =>
    readStatus(currentParams),
  );

  const handleConfirm = () => {
    const params = new URLSearchParams(searchParams?.toString());

    params.delete("brand");
    params.delete("category");
    params.delete("shop");
    params.delete("price_min");
    params.delete("price_max");
    statusFilters.forEach(({ id }) => params.delete(id));

    brands.forEach((brand) => params.append("brand", brand));
    categories.forEach((category) => params.append("category", category));
    shops.forEach((shop) => params.append("shop", shop));

    if (priceRange[0] > priceBounds[0]) {
      params.set("price_min", String(priceRange[0]));
    }
    if (priceRange[1] < priceBounds[1]) {
      params.set("price_max", String(priceRange[1]));
    }

    statusFilters.forEach(({ id }) => {
      if (status[id]) params.set(id, "1");
    });

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
    setShowFilter(false);
  };

  return (
    <Drawer direction='right' open={showFilter} onOpenChange={setShowFilter}>
      <DrawerTrigger asChild>
        <Button
          type='button'
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
      <DrawerContent className='flex flex-col overflow-hidden'>
        <DrawerHeader>
          <DrawerTitle>Фильтр</DrawerTitle>
          <DrawerDescription>Настрой свой поиск баночек</DrawerDescription>
        </DrawerHeader>
        <FieldGroup className='flex-1 overflow-y-auto p-4'>
          <Field>
            <FieldLabel htmlFor='brand'>Бренд</FieldLabel>
            <Combobox
              defaultOptions={filterOptions.brands}
              value={brands}
              onValueChange={setBrands}
              id='brand'
              placeholder='Введите или выберите бренд...'
              multiple
            />
          </Field>

          <Field>
            <FieldLabel htmlFor='category'>Тип продукта</FieldLabel>
            <Combobox
              defaultOptions={filterOptions.categories}
              value={categories}
              onValueChange={setCategories}
              id='category'
              placeholder='Введите или выберите тип продукта...'
              multiple
            />
          </Field>

          <Field>
            <FieldLabel htmlFor='shop'>Магазин</FieldLabel>
            <Combobox
              defaultOptions={filterOptions.shops}
              value={shops}
              onValueChange={setShops}
              id='shop'
              placeholder='Введите или выберите магазин...'
              multiple
            />
          </Field>

          <Field>
            <FieldLabel htmlFor='price'>Стоимость покупки</FieldLabel>
            <div className='flex flex-col gap-2 pt-2'>
              <Slider
                id='price'
                min={priceBounds[0]}
                max={priceBounds[1]}
                step={100}
                value={priceRange}
                onValueChange={(value) =>
                  setPriceRange([value[0], value[1]] as [number, number])
                }
              />
              <div className='flex justify-between text-sm text-muted-foreground'>
                <span>{priceRange[0]} ₽</span>
                <span>{priceRange[1]} ₽</span>
              </div>
            </div>
          </Field>

          {statusFilters.map(({ id, label }) => (
            <Field key={id} orientation='horizontal' className='w-fit'>
              <Switch
                id={id}
                checked={status[id]}
                onCheckedChange={(checked) =>
                  setStatus((current) => ({ ...current, [id]: checked }))
                }
              />
              <FieldLabel htmlFor={id}>{label}</FieldLabel>
            </Field>
          ))}
        </FieldGroup>
        <DrawerFooter>
          <Button type='button' onClick={handleConfirm}>
            Подтвердить
          </Button>
          <DrawerClose asChild>
            <Button type='button' variant='destructive'>
              Сбросить
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
