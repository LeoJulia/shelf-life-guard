import { cn } from "@/shared/utils";
import {
  BadgeRussianRuble,
  Clock,
  Package,
  SoapDispenserDroplet,
} from "lucide-react";
import { getStatistic } from "../api";

export const StatisticCards = async () => {
  const { total, spentYear, expiring30Days, openedTotal } =
    await getStatistic();

  const stats = [
    {
      label: "Всего продуктов",
      value: total,
      icon: Package,
      // change: "",
      color: "bg-[oklch(0.92_0.08_340)] text-[oklch(0.45_0.12_340)]",
      iconBg: "bg-[oklch(0.85_0.1_340)]",
    },
    {
      label: "Потрачено за год",
      value: spentYear,
      icon: BadgeRussianRuble,
      // change: "",
      color: "bg-[oklch(0.92_0.08_165)] text-[oklch(0.4_0.1_165)]",
      iconBg: "bg-[oklch(0.85_0.1_165)]",
    },
    {
      label: "Открыто всего",
      value: openedTotal,
      icon: SoapDispenserDroplet,
      // change: "среди всех продуктов",
      color: "bg-[oklch(0.92_0.08_200)] text-[oklch(0.45_0.1_200)]",
      iconBg: "bg-[oklch(0.85_0.1_200)]",
    },
    {
      label: "Скоро просрок",
      value: expiring30Days,
      icon: Clock,
      // change: "Within 30 days",
      color: "bg-[oklch(0.92_0.08_280)] text-[oklch(0.45_0.1_280)]",
      iconBg: "bg-[oklch(0.85_0.1_280)]",
    },
  ];

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div key={stat.label} className={cn("rounded-2xl p-5", stat.color)}>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium opacity-80'>
                {stat.label}
              </span>
              <div className={cn("size-8 rounded-md p-1.5", stat.iconBg)}>
                <Icon className='size-5 text-white' />
              </div>
            </div>
            <p className='mt-2 text-3xl font-bold'>{stat.value}</p>
          </div>
        );
      })}
      {/* <div v-for="stat in stats">
      <div :key="stat.label" :className="['rounded-2xl p-5', stat.color]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium opacity-80">
            {{ stat.label }}
          </span>
          <div :className="['size-8 rounded-md p-1.5', stat.iconBg]">
            <UIcon :name="stat.icon" className="size-5 text-white" />
          </div>
        </div>
        <p className="mt-2 text-3xl font-bold">
          {{ stat.value }}
        </p>
      </div>
    </div> */}
    </div>
  );
};
