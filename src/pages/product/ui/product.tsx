import Image from "next/image";
import Link from "next/link";
import { getProduct } from "../api/get-product";
import { formatProductDate } from "../utils/format-date";
import { ProductRow, ProductValue } from "./product-row";
import { DeleteProductDialog } from "./delete-product-dialog";
import { Button } from "@/shared/ui/button";
import { Edit, ImageIcon, Trash } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Field, FieldLabel } from "@/shared/ui/field";
import { notFound } from "next/navigation";
import { ExpiryBar } from "@/entities/product/ui/expiry-bar";
import { Rating } from "@/entities/product/ui/rating";
import { Tags } from "@/entities/product/ui/tags";
import { CopyIngredientsButton } from "@/entities/product";

export const Product = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <Card className='group relative overflow-hidden rounded-xl border border-border bg-card'>
      <CopyIngredientsButton product={product} />
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-0'>
        <div className='flex flex-col'>
          <CardHeader>
            <CardDescription className='text-s font-medium uppercase tracking-wider text-muted-foreground'>
              {product?.brand}
            </CardDescription>
            <CardTitle className='mt-0.5 text-base font-semibold leading-tight text-foreground'>
              {product?.name}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Rating rating={product.rating} />
            <Tags product={product} />
            <ExpiryBar product={product} />
          </CardContent>
          <CardContent className='h-full flex flex-col gap-3'>
            <ProductRow field='Категория' value={product?.category} />
            <ProductRow field='Объем' value={product?.volume} />
            <ProductRow field='Рыночная цена' value={product?.market_price} />
            <ProductRow field='Цена покупки' value={product?.actual_price} />
            <ProductRow field='Магазин' value={product?.shop} />
            <div className='lg:flex gap-2'>
              <Field>
                <FieldLabel>Срок годности</FieldLabel>
                <ProductValue>
                  {formatProductDate(product?.expiry_date)}
                </ProductValue>
              </Field>
              <Field>
                <FieldLabel>Дата открытия</FieldLabel>
                <ProductValue>
                  {formatProductDate(product?.opened_at)}
                </ProductValue>
              </Field>
              <Field>
                <FieldLabel>Дата окончания</FieldLabel>
                <ProductValue>
                  {formatProductDate(product?.finished_at)}
                </ProductValue>
              </Field>
            </div>
            <ProductRow
              field='Состав'
              value={product?.ingredients}
              collapsable
            />
            <ProductRow
              field='Комментарий'
              value={product?.notes}
              collapsable
            />
          </CardContent>
          <CardFooter className='flex gap-3 mt-8'>
            <Link href={`/product/${id}/edit`}>
              <Button>
                <Edit />
                Редактировать
              </Button>
            </Link>
            <DeleteProductDialog
              productId={product.id}
              productName={product.name}
              trigger={
                <Button variant='destructive'>
                  <Trash />
                  Удалить
                </Button>
              }
            />
          </CardFooter>
        </div>
        <div className='bg-muted flex items-center justify-center p-8 lg:p-12 min-h-[400px]'>
          {product.imageUrl ? (
            <div className='relative w-full max-w-xs'>
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={615}
                height={832}
                className='w-full h-auto object-contain rounded-2xl'
              />
            </div>
          ) : (
            <div className='text-muted-foreground flex flex-col items-center gap-2'>
              <ImageIcon className='size-16' />
              <span className='text-sm'>Нет изображения</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
