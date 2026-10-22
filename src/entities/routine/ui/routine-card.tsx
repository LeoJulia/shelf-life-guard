import Link from "next/link";
import { Image as ImageIcon, Moon, Package, Sun } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import type { TRoutine } from "../model/routine-types";
import { getRoutineStatus } from "../model/routine-status";
import { matchesTimePart, type TTimePart } from "../lib/today-items";
import { formatRoutineRange, getRoutineTitle } from "../lib/routine-labels";
import { RoutineStatusChip } from "./routine-status-chip";

const Stat = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: number;
}) => (
  <div className='rounded-lg bg-muted p-2.5'>
    <div className='flex items-center gap-1 text-muted-foreground'>
      <Icon className='size-4' />
      <span className='text-[10px] font-medium uppercase tracking-wide'>
        {label}
      </span>
    </div>
    <p className='mt-1 text-xs font-semibold text-foreground'>{value}</p>
  </div>
);

export const RoutineCard = ({
  routine,
  actions,
}: {
  routine: TRoutine;
  /** Кнопки действий. Рендерятся вне ссылки, чтобы не вкладывать интерактив. */
  actions?: React.ReactNode;
}) => {
  const items = routine.items ?? [];

  const countBy = (part: TTimePart) =>
    items.filter((item) => matchesTimePart(item.time_of_day, part)).length;

  return (
    <div className='group relative'>
      <Link href={`/routine/${routine.id}`} className='block'>
        <Card className='h-full overflow-hidden rounded-xl border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'>
          <CardHeader>
            <div className='flex items-start justify-between gap-2'>
              <CardTitle className='text-base leading-tight font-semibold'>
                {getRoutineTitle(routine)}
              </CardTitle>
              <RoutineStatusChip status={getRoutineStatus(routine)} />
            </div>
            <CardDescription>{formatRoutineRange(routine)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
              <Stat icon={Package} label='Средств' value={items.length} />
              <Stat icon={Sun} label='Утром' value={countBy("morning")} />
              <Stat icon={Moon} label='Вечером' value={countBy("evening")} />
              <Stat
                icon={ImageIcon}
                label='Фото'
                value={routine.photos?.length ?? 0}
              />
            </div>
          </CardContent>
        </Card>
      </Link>
      {actions ? <div className='mt-2 flex gap-2'>{actions}</div> : null}
    </div>
  );
};
