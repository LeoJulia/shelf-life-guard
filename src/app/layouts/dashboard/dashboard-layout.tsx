import { Suspense } from "react";
import {
  Control,
  StatisticCards,
  StatisticCardsSkeleton,
} from "@/pages/dashboard";

export const DashboardLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <div>
    <Suspense fallback={<StatisticCardsSkeleton />}>
      <StatisticCards />
    </Suspense>
    <Suspense>
      <Control />
    </Suspense>
    {children}
  </div>
);
