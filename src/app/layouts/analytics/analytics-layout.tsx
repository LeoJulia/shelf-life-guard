import { Suspense } from "react";
import { getFilter } from "@/entities/filter";
import { ProductSearch } from "@/widgets/product-search";

export const AnalyticsLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const filterOptions = await getFilter();

  return (
    <Suspense>
      <ProductSearch filterOptions={filterOptions}>{children}</ProductSearch>
    </Suspense>
  );
};
