"use client";

import { useRef, useState } from "react";
import Form from "next/form";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { TProduct } from "@/entities/product";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { EMPTY_PRODUCT } from "../utils/empty-product";
import { Combobox } from "@/shared/ui/combobox";
import { RatingInput } from "./rating-input";
import { ImageUpload } from "./image-upload";
import { CollapsibleTextarea } from "@/shared/ui/collapsible-textarea";
import { ProductFormFooter } from "./product-form-footer";
import { BarcodeScanner } from "./barcode-scanner";
import type { TScannedProduct } from "../model/barcode-types";

type TFormSnapshot = {
  brand?: string;
  name?: string;
  volume?: string;
  category?: string;
  ingredients?: string;
  image?: string;
  rating?: number | null;
  tags?: string[];
  market_price?: string;
  actual_price?: string;
  shop?: string;
  expiry_date?: string;
  opened_at?: string;
  finished_at?: string;
  notes?: string;
};

/** Читает текущие значения формы, чтобы скан не стирал уже введённое. */
const snapshotForm = (root: HTMLDivElement | null): TFormSnapshot => {
  const form = root?.querySelector("form");
  if (!form) return {};

  const fd = new FormData(form);
  const text = (name: string) => {
    const value = fd.get(name);
    return typeof value === "string" ? value : undefined;
  };
  const rating = text("rating");

  return {
    brand: text("brand"),
    name: text("name"),
    volume: text("volume"),
    category: text("category"),
    ingredients: text("ingredients"),
    image: text("image"),
    rating: rating === undefined || rating === "" ? null : Number(rating),
    tags: fd.getAll("tags").map(String),
    market_price: text("market_price"),
    actual_price: text("actual_price"),
    shop: text("shop"),
    expiry_date: text("expiry_date"),
    opened_at: text("opened_at"),
    finished_at: text("finished_at"),
    notes: text("notes"),
  };
};

/** Каноническое написание значения из списка автокомплита или undefined. */
const pickFromList = (value: string | undefined, list: string[]) =>
  value ? list.find((o) => o.toLowerCase() === value.toLowerCase()) : undefined;

export const ProductForm = ({
  action,
  product,
  brandsList,
  categoriesList,
  volumesList,
  shopsList,
  tagsList,
}: {
  action: (formData: FormData) => void | Promise<void>;
  product?: TProduct;
  brandsList: string[];
  categoriesList: string[];
  volumesList: string[];
  shopsList: string[];
  tagsList: string[];
}) => {
  const isEditing = !!product;
  const base = product ?? EMPTY_PRODUCT;

  // Значения, найденные по штрих-коду. Бренд/категория подставляются, только
  // если совпали со списками автокомплита, чтобы не засорять их дублями.
  const [scanned, setScanned] = useState<TScannedProduct | null>(null);
  // Снимок полей на момент скана: всё, что скан не трогает (рейтинг, теги,
  // цены, даты, комментарий), переживает перемонтирование формы.
  const [manual, setManual] = useState<TFormSnapshot>({});
  // Смена key перемонтирует форму, чтобы неконтролируемые поля и Combobox
  // подхватили новые defaultValue после сканирования.
  const [formKey, setFormKey] = useState(0);
  const formWrapRef = useRef<HTMLDivElement>(null);

  const handleFound = (found: TScannedProduct) => {
    setManual(snapshotForm(formWrapRef.current));
    setScanned({
      ...found,
      brand: pickFromList(found.brand, brandsList),
      category: pickFromList(found.category, categoriesList),
    });
    setFormKey((k) => k + 1);
  };

  const v = {
    brand: scanned?.brand ?? manual.brand ?? base.brand,
    name: scanned?.name ?? manual.name ?? base.name,
    volume: scanned?.volume ?? manual.volume ?? base.volume,
    category: scanned?.category ?? manual.category ?? base.category,
    ingredients: scanned?.ingredients ?? manual.ingredients ?? base.ingredients,
    image: scanned?.imageBase64 ?? manual.image ?? base.imageUrl ?? "",
  };

  const f = {
    rating: manual.rating !== undefined ? manual.rating : base.rating,
    tags: manual.tags ?? base.tags?.map((tag) => tag.name) ?? [],
    market_price: manual.market_price ?? base.market_price ?? undefined,
    actual_price: manual.actual_price ?? base.actual_price ?? undefined,
    shop: manual.shop ?? base.shop ?? undefined,
    expiry_date: manual.expiry_date ?? base.expiry_date ?? undefined,
    opened_at: manual.opened_at ?? base.opened_at ?? undefined,
    finished_at: manual.finished_at ?? base.finished_at ?? undefined,
    notes: manual.notes ?? base.notes ?? undefined,
  };

  const title = isEditing ? "Редактирование баночки" : "Добавление баночки";

  return (
    <Card className='group relative overflow-hidden rounded-xl border border-border bg-card'>
      <div ref={formWrapRef}>
      <Form key={formKey} action={action}>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-0'>
          <div className='flex flex-col'>
            <CardHeader className='flex-row items-center justify-between gap-2'>
              <CardTitle className='text-xl font-bold text-foreground'>
                {title}
              </CardTitle>
              {!isEditing && <BarcodeScanner onFound={handleFound} />}
            </CardHeader>
            <CardContent className='space-y-4'>
              <FieldGroup>
                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='brand'>Бренд</FieldLabel>
                  <Combobox
                    defaultOptions={brandsList}
                    defaultValue={v.brand ?? undefined}
                    name='brand'
                    id='brand'
                    placeholder='Введите или выберите бренд...'
                    isEditable
                    required
                  />
                </Field>

                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='name'>Название</FieldLabel>
                  <Input
                    defaultValue={v.name ?? undefined}
                    id='name'
                    name='name'
                  />
                </Field>

                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='rating'>Рейтинг</FieldLabel>
                  <RatingInput defaultValue={f.rating} name='rating' />
                </Field>

                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='tags'>Теги</FieldLabel>
                  <Combobox
                    defaultOptions={tagsList}
                    defaultValue={f.tags}
                    name='tags'
                    id='tags'
                    placeholder='Выберите или создайте теги...'
                    multiple
                    isEditable
                  />
                </Field>

                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='category'>Категория</FieldLabel>
                  <Combobox
                    defaultOptions={categoriesList}
                    defaultValue={v.category ?? undefined}
                    name='category'
                    id='category'
                    placeholder='Введите или выберите категорию...'
                    isEditable
                  />
                </Field>

                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='volume'>Объем</FieldLabel>
                  <Combobox
                    defaultOptions={volumesList}
                    defaultValue={v.volume ?? undefined}
                    name='volume'
                    id='volume'
                    placeholder='Введите или выберите объем...'
                    isEditable
                  />
                </Field>

                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='market_price'>Рыночная цена</FieldLabel>
                  <Input
                    type='text'
                    inputMode='decimal'
                    pattern='^\d+([.,]\d{1,2})?$'
                    defaultValue={f.market_price}
                    id='market_price'
                    name='market_price'
                  />
                </Field>

                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='actual_price'>Цена покупки</FieldLabel>
                  <Input
                    type='text'
                    inputMode='decimal'
                    pattern='^\d+([.,]\d{1,2})?$'
                    defaultValue={f.actual_price}
                    id='actual_price'
                    name='actual_price'
                  />
                </Field>

                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='shop'>Магазин</FieldLabel>
                  <Combobox
                    defaultOptions={shopsList}
                    defaultValue={f.shop}
                    name='shop'
                    id='shop'
                    placeholder='Введите или выберите магазин...'
                    isEditable
                  />
                </Field>

                <div className='lg:flex'>
                  <Field>
                    <FieldLabel htmlFor='expiry_date'>Срок годности</FieldLabel>
                    <Input
                      className='justify-end'
                      id='expiry_date'
                      name='expiry_date'
                      type='date'
                      defaultValue={f.expiry_date}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor='opened_at'>Дата открытия</FieldLabel>
                    <Input
                      className='justify-end'
                      type='date'
                      defaultValue={f.opened_at}
                      id='opened_at'
                      name='opened_at'
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor='finished_at'>
                      Дата окончания
                    </FieldLabel>
                    <Input
                      className='justify-end'
                      type='date'
                      defaultValue={f.finished_at}
                      id='finished_at'
                      name='finished_at'
                    />
                  </Field>
                </div>
                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='ingredients' className='pt-2'>
                    Состав
                  </FieldLabel>
                  <FieldContent>
                    <CollapsibleTextarea
                      id='ingredients'
                      name='ingredients'
                      defaultValue={v.ingredients ?? undefined}
                    />
                  </FieldContent>
                </Field>

                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='notes' className='pt-2'>
                    Комментарий
                  </FieldLabel>
                  <FieldContent>
                    <CollapsibleTextarea
                      id='notes'
                      name='notes'
                      defaultValue={f.notes}
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter>
              <ProductFormFooter
                cancelHref={
                  isEditing ? `/product/${product!.id}` : "/dashboard"
                }
              />
            </CardFooter>
          </div>
          <div className='bg-muted flex items-center justify-center p-8 lg:p-12 min-h-[400px]'>
            <ImageUpload name='image' value={v.image} />
          </div>
        </div>
      </Form>
      </div>
    </Card>
  );
};
