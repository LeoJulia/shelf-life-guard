import { Package } from "lucide-react";
import { getProductList, ProductCard } from "@/entities/product";

export const Dashboard = async ({
  searchParams,
}: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) => {
  const searchParameters = await searchParams;
  const query = searchParameters?.query || "";

  const products = await getProductList({ searchQuery: query });

  if (!products?.length) {
    return (
      <div className='mt-6'>
        <div className='mt-12 flex flex-col items-center justify-center text-center'>
          <Package className='h-12 w-12 text-muted-foreground' />
          <h3 className='mt-4 text-lg font-medium text-foreground'>
            Упс... Нет баночек
          </h3>
          <p className='mt-1 text-sm text-muted-foreground'>
            Попробуйте обновить страницу, настроить свой поиск или добавить
            новый продукт
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='mt-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-foreground'>Мои баночки</h2>
        <span className='text-sm text-muted-foreground'>
          {products.length} шт
        </span>
      </div>
      <div className='columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4'>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
