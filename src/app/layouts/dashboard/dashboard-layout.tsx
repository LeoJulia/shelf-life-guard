import { Suspense } from "react";
import { getFilter } from "@/entities/filter";
import {
  DashboardSearch,
  StatisticCards,
  StatisticCardsSkeleton,
} from "@/pages/dashboard";

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
        <DashboardSearch filterOptions={filterOptions}>
          {children}
        </DashboardSearch>
      </Suspense>
    </div>
  );
};
