import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { RoutineCard } from "@/entities/routine";
import { getRoutineList } from "../api/routine-list";

export const Routine = async () => {
  const routines = await getRoutineList();

  return (
    <div className='flex flex-col gap-5'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <h1 className='text-xl font-semibold text-foreground'>Рутины</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Курсы ухода: состав по утрам и вечерам, фото «до» и «после», итоги
          </p>
        </div>
        <Link href='/routine/new'>
          <Button>
            <Plus />
            Новая рутина
          </Button>
        </Link>
      </div>

      {routines.length === 0 ? (
        <Card className='rounded-xl border-border bg-card'>
          <CardContent className='flex flex-col items-center gap-3 py-12 text-center'>
            <CalendarDays className='text-muted-foreground size-10' />
            <p className='text-muted-foreground max-w-md text-sm'>
              Рутин пока нет. Создайте первую: добавьте средства, отметьте утро
              и вечер, а дни недели — для переменных средств.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {routines.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} />
          ))}
        </div>
      )}
    </div>
  );
};
