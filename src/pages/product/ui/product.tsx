import Image from "next/image";
import Link from "next/link";
import { getProduct } from "../api/get-product";
import { ProductRow } from "./product-row";
import { Button } from "@/shared/ui/button";
import { CircleArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { notFound } from "next/navigation";
import { ExpiryBar } from "@/entities/product/ui/expiry-bar";
import { Rating } from "@/entities/product/ui/rating";
import { Tags } from "@/entities/product/ui/tags";

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
    <>
      <div className='flex justify-between pb-2'>
        <Link href='/dashboard'>
          <Button color='neutral' variant='ghost'>
            <CircleArrowLeft className='size-8' />
            Назад
          </Button>
        </Link>

        {/* <UButton color="neutral" variant="ghost" @click="onDeleteProduct">
          <UIcon name="mage:box-cross" className="size-8" />
        </UButton> */}

        {/* // <ProductForm :product="product">
        //   <UButton color="neutral" variant="ghost">
        //     <UIcon name="mage:edit" className="size-8" />
        //   </UButton>
        // </ProductForm>  */}
      </div>

      <Card className='md:grid md:grid-cols-3 gap-2 group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'>
        <div className='col-span-2'>
          <CardHeader className='mb-6'>
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
          <CardContent className='flex flex-col divide-y mt-4'>
            <ProductRow field='Комментарий' value={product?.notes} />
            <ProductRow field='Состав' value={product?.ingredients} />
            <ProductRow
              field='Рыночная стоимость'
              value={product?.market_price}
            />
            <ProductRow
              field='Стоимость покупки'
              value={product?.actual_price}
            />
            <ProductRow field='Магазин покупки' value={product?.shop} />
            {product?.opened_at && (
              <ProductRow
                field='Дата начала использования'
                value={new Date(product.opened_at).toLocaleDateString("ru-RU", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              />
            )}
            {product?.finished_at && (
              <ProductRow
                field='Дата окончания использования'
                value={new Date(product.finished_at).toLocaleDateString(
                  "ru-RU",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                )}
              />
            )}
            {product?.expiry_date && (
              <ProductRow
                field='Срок годности'
                value={new Date(product.expiry_date).toLocaleDateString(
                  "ru-RU",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                )}
              />
            )}
          </CardContent>
        </div>
        {/* @ts-ignore */}
        {product.imageUrl && (
          <div className='relative h-auto w-full flex-shrink-0 overflow-hidden rounded-lg bg-input'>
            <Image
              // @ts-ignore
              src={product.imageUrl}
              alt='product.name'
              fill
              loading='eager'
              className='object-cover transition-transform duration-300 group-hover:scale-105 h-full'
            />
          </div>
        )}
      </Card>
    </>
  );
};
