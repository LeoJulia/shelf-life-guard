import { getProductList, ProductCard } from "@/entities/product";

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
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
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
