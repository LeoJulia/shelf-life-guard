import { Filter } from "lucide-react";
import { useState } from "react";
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
import Form from "next/form";
import type { TFilterOptions } from "@/entities/filter";

const statusFilters = [
  { id: "opened", label: "Открытые баночки" },
  { id: "closed", label: "Закрытые баночки" },
  { id: "finished", label: "Законченные баночки" },
  { id: "expiring-soon", label: "Срок меньше 30 дней" },
  { id: "expiring", label: "Срок меньше 90 дней" },
];

export const ProductFilter = ({
  filterOptions,
}: {
  filterOptions: TFilterOptions;
}) => {
  const { priceRange: priceBounds } = filterOptions;
  const [showFilter, setShowFilter] = useState(false);
  const [priceRange, setPriceRange] = useState<number[]>(priceBounds);

  return (
    <Form action={{}}>
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
                defaultValue={undefined}
                name='brand'
                id='brand'
                placeholder='Введите или выберите бренд...'
                multiple
              />
            </Field>

            <Field>
              <FieldLabel htmlFor='category'>Тип продукта</FieldLabel>
              <Combobox
                defaultOptions={filterOptions.categories}
                defaultValue={undefined}
                name='category'
                id='category'
                placeholder='Введите или выберите тип продукта...'
                multiple
              />
            </Field>

            <Field>
              <FieldLabel htmlFor='shop'>Магазин</FieldLabel>
              <Combobox
                defaultOptions={filterOptions.shops}
                defaultValue={undefined}
                name='shop'
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
                  onValueChange={(value) => setPriceRange(value)}
                />
                <div className='flex justify-between text-sm text-muted-foreground'>
                  <span>{priceRange[0]} ₽</span>
                  <span>{priceRange[1]} ₽</span>
                </div>
              </div>
            </Field>

            {statusFilters.map(({ id, label }) => (
              <Field key={id} orientation='horizontal' className='w-fit'>
                <Switch id={id} name={id} />
                <FieldLabel htmlFor={id}>{label}</FieldLabel>
              </Field>
            ))}
          </FieldGroup>
          <DrawerFooter>
            <Button type='button'>Подтвердить</Button>
            <DrawerClose asChild>
              <Button type='button' variant='destructive'>
                Сбросить
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Form>
  );
};
