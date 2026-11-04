import { Suspense } from "react";
import { getFilter } from "@/entities/filter";
import { ProductSearch } from "@/widgets/product-search";
import { StatisticCards, StatisticCardsSkeleton } from "@/widgets/statistic-cards";

export const DashboardLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const filterOptions = await getFilter();

  return (
    <div>
      <Suspense fallback={<StatisticCardsSkeleton />}>
        <StatisticCards />
      </Suspense>
      <Suspense>
        <ProductSearch filterOptions={filterOptions}>
          {children}
        </ProductSearch>
      </Suspense>
    </div>
  );
};
