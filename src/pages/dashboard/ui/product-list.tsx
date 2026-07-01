import Link from "next/link";
import { getProductList } from "@/entities/product";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Rating } from "@/shared/ui/rating";
import { Tags } from "@/shared/ui/tags";

export const ProductList = async () => {
  const products = await getProductList({});

  return (
    <div className='mt-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-foreground'>Мои баночки</h2>
        <span className='text-sm text-muted-foreground'>
          {products.length} шт
        </span>
      </div>
      <div
        className='mt-4 grid gap-4'
        // className="viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'"
      >
        {products.map((product) => {
          const url = `/product/${product.id}`;

          return (
            <Link href={url} key={product.id}>
              <Card className='group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'>
                <CardHeader className='flex-row gap-4'>
                  <div className='relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-input'>
                    <img
                      src={product.imageUrl ?? ""}
                      alt='product.name'
                      className='object-cover transition-transform duration-300 group-hover:scale-105 h-full'
                    />
                  </div>
                  <div className='flex flex-1 flex-col'>
                    <CardDescription>{product.brand}</CardDescription>
                    <CardTitle>{product.name}</CardTitle>

                    <Rating rating={product.rating} />
                    <Tags product={product} />
                  </div>
                </CardHeader>
                <CardContent>{product.id}</CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
// {/* <div className='mt-6'>
//   <div className='mt-12 flex flex-col items-center justify-center text-center'>
//     {/* <UIcon name="mage:package-box" className="h-12 w-12 text-muted-foreground" /> */}
//     <h3 className='mt-4 text-lg font-medium text-foreground'>
//       Упс... Нет баночек
//     </h3>
//     <p className='mt-1 text-sm text-muted-foreground'>
//       Попробуйте обновить страницу, настроить свой поиск или добавить
//       новый продукт
//     </p>
//   </div>
// </div> */}
