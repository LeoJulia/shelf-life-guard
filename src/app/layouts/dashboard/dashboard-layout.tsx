import { Suspense } from "react";
import {
  Control,
  StatisticCards,
  StatisticCardsSkeleton,
} from "@/pages/dashboard";
import "../../styles/globals.css";

export const DashboardLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <div className='mx-auto max-w-7xl px-6 py-8'>
    <Suspense fallback={<StatisticCardsSkeleton />}>
      <StatisticCards />
    </Suspense>
    <Suspense>
      <Control />
    </Suspense>
    {children}
  </div>
);
