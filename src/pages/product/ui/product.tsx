import Image from "next/image";
import Link from "next/link";
import { getProduct } from "../api/get-product";
import { ProductRow } from "./product-row";
import { DeleteProductDialog } from "./delete-product-dialog";
import { Button } from "@/shared/ui/button";
import { Edit, Trash } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
    <Card className='group relative overflow-hidden rounded-xl border border-border bg-card'>
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
          <CardContent className='h-full flex flex-col divide-y'>
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
                value={new Date(product.opened_at).toLocaleDateString(
                  "ru-RU",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                )}
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
          {product.imageUrl && (
            <div className='relative w-full max-w-xs'>
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={615}
                height={832}
                className='w-full h-auto object-contain rounded-2xl'
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
