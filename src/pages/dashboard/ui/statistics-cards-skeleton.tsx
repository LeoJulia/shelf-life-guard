import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/utils";

const StatisticCard = ({ className }: { className?: string }) => (
  <Skeleton className={cn("rounded-2xl p-5 h-[116px]", className)} />
);

export const StatisticCardsSkeleton = () => (
  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
    <StatisticCard className='bg-[oklch(0.92_0.08_340)]' />
    <StatisticCard className='bg-[oklch(0.92_0.08_165)]' />
    <StatisticCard className='bg-[oklch(0.92_0.08_200)]' />
    <StatisticCard className='bg-[oklch(0.92_0.08_280)]' />
  </div>
);
