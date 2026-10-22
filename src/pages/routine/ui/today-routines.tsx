import Link from "next/link";
import type { ReactNode } from "react";
import { weekdayFullLabels, type TTodayRoutines } from "@/entities/routine";
import { TodayColumns } from "./today-columns";

const RoutineLink = ({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) => (
  <Link href={`/routine/${id}`} className='hover:text-primary hover:underline'>
    {children}
  </Link>
);

/**
 * Средства на сегодня по всем активным рутинам.
 *
 * Названия рутин выводятся, только если на сегодня есть позиции из разных
 * рутин: иначе заголовок дня уже ведёт на единственную рутину.
 */
export const TodayRoutines = ({ day, routines }: TTodayRoutines) => {
  if (routines.length === 0) {
    return null;
  }

  const dayLabel = `Сегодня — ${weekdayFullLabels[day].toLowerCase()}`;
  const showTitles = routines.length > 1;

  return (
    <section className='flex flex-col gap-3'>
      <h2 className='text-foreground text-sm font-semibold'>
        {showTitles ? (
          dayLabel
        ) : (
          <RoutineLink id={routines[0].id}>{dayLabel}</RoutineLink>
        )}
      </h2>

      {routines.map((routine) => (
        <div key={routine.id} className='flex flex-col gap-2'>
          {showTitles && (
            <h3 className='text-foreground text-sm font-medium'>
              <RoutineLink id={routine.id}>{routine.title}</RoutineLink>
            </h3>
          )}
          <TodayColumns byPart={routine.byPart} />
        </div>
      ))}
    </section>
  );
};
