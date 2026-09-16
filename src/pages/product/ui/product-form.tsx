import { Save } from "lucide-react";
import Form from "next/form";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { TProduct } from "@/entities/product";
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { createProduct } from "../api/create-product";
import { updateProduct } from "../api/update-product";
import { EMPTY_PRODUCT } from "../utils/empty-product";
import { Combobox } from "./combobox";
import { RatingInput } from "./rating-input";
import { ImageUpload } from "./image-upload";
import Link from "next/link";

export const ProductForm = ({
  product,
  brandsList,
  categoriesList,
  volumesList,
  shopsList,
}: {
  product?: TProduct;
  brandsList: string[];
  categoriesList: string[];
  volumesList: string[];
  shopsList: string[];
}) => {
  const isEditing = !!product;
  const currentProduct = product ?? EMPTY_PRODUCT;

  const action = isEditing
    ? updateProduct.bind(null, product!.id)
    : createProduct;

  const title = isEditing ? "Редактирование баночки" : "Добавление баночки";

  return (
    <Card className='group relative overflow-hidden rounded-xl border border-border bg-card'>
      <Form action={action}>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-0'>
          <div className='flex flex-col'>
            <CardHeader>
              <CardTitle className='text-xl font-bold text-foreground'>
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <FieldGroup>
                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='brand'>Бренд</FieldLabel>
                  <Combobox
                    defaultOptions={brandsList}
                    defaultValue={currentProduct.brand ?? undefined}
                    name='brand'
                    id='brand'
                    placeholder='Введите или выберите бренд...'
                  />
                </Field>

                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='name'>Название</FieldLabel>
                  <Input
                    defaultValue={currentProduct.name ?? undefined}
                    id='name'
                    name='name'
                  />
                </Field>
                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='rating'>Рейтинг</FieldLabel>
                  <RatingInput
                    defaultValue={currentProduct.rating}
                    name='rating'
                  />
                </Field>

                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='category'>Категория</FieldLabel>
                  <Combobox
                    defaultOptions={categoriesList}
                    defaultValue={currentProduct.category ?? undefined}
                    name='category'
                    id='category'
                    placeholder='Введите или выберите категорию...'
                  />
                </Field>

                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='volume'>Объем</FieldLabel>
                  <Combobox
                    defaultOptions={volumesList}
                    defaultValue={currentProduct.volume ?? undefined}
                    name='volume'
                    id='volume'
                    placeholder='Введите или выберите объем...'
                  />
                </Field>

                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='market_price'>Рыночная цена</FieldLabel>
                  <Input
                    type='text'
                    inputMode='decimal'
                    pattern='^\d+([.,]\d{1,2})?$'
                    defaultValue={currentProduct.market_price ?? undefined}
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
                    defaultValue={currentProduct.actual_price ?? undefined}
                    id='actual_price'
                    name='actual_price'
                  />
                </Field>

                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='shop'>Магазин</FieldLabel>
                  <Combobox
                    defaultOptions={shopsList}
                    defaultValue={currentProduct.shop ?? undefined}
                    name='shop'
                    id='shop'
                    placeholder='Введите или выберите магазин...'
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
                      defaultValue={currentProduct.expiry_date ?? undefined}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor='opened_at'>Дата открытия</FieldLabel>
                    <Input
                      className='justify-end'
                      type='date'
                      defaultValue={currentProduct.opened_at ?? undefined}
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
                      defaultValue={currentProduct.finished_at ?? undefined}
                      id='finished_at'
                      name='finished_at'
                    />
                  </Field>
                </div>
                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='ingredients'>Состав</FieldLabel>
                  <Textarea
                    defaultValue={currentProduct.ingredients ?? undefined}
                    id='ingredients'
                    name='ingredients'
                  />
                </Field>

                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='notes'>Заметки</FieldLabel>
                  <Textarea
                    defaultValue={currentProduct.notes ?? undefined}
                    id='notes'
                    name='notes'
                  />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className='flex gap-3'>
              <Button type='submit'>
                <Save />
                Сохранить
              </Button>
              <Link href={isEditing ? `/product/${product!.id}` : "/dashboard"}>
                <Button type='button' variant='secondary'>
                  Отмена
                </Button>
              </Link>
            </CardFooter>
          </div>
          <div className='bg-muted flex items-center justify-center p-8 lg:p-12 min-h-[400px]'>
            <ImageUpload name='image' value={currentProduct.imageUrl} />
          </div>
        </div>
      </Form>
    </Card>
  );
};
