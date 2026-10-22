import Link from "next/link";
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Field, FieldLabel } from "@/shared/ui/field";
import { ProductRow, ProductValue } from "@/shared/ui/product-row";
import { formatDate } from "@/shared/lib/format-date";
import {
  formatRoutineRange,
  getRoutineStatus,
  getRoutineTitle,
  RoutineStatusChip,
} from "@/entities/routine";
import { getProductOptions } from "@/entities/product";
import { getRoutine } from "../api/get-routine";
import { DeleteRoutineDialog } from "./delete-routine-dialog";
import { DuplicateRoutineButton } from "./duplicate-routine-button";
import { FinishRoutineButton } from "./finish-routine-button";
import { RoutineItemsEditor } from "./routine-items-editor";
import { RoutinePhotoCompare } from "./routine-photo-compare";
import { RoutinePhotoGrid } from "./routine-photo-grid";
import { TodaySection } from "./today-section";

export const RoutineDetail = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const [routine, productOptions] = await Promise.all([
    getRoutine(id),
    getProductOptions(),
  ]);

  const status = getRoutineStatus(routine);

  return (
    <div className='flex flex-col gap-4'>
      <Card className='group relative overflow-hidden rounded-xl border-border bg-card'>
        <CardHeader>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <CardTitle className='text-base leading-tight font-semibold text-foreground'>
                {getRoutineTitle(routine)}
              </CardTitle>
              <CardDescription>{formatRoutineRange(routine)}</CardDescription>
            </div>
            <RoutineStatusChip status={status} />
          </div>
        </CardHeader>

        <CardContent className='flex flex-col gap-3'>
          <ProductRow field='Название' value={routine.name} />
          <div className='lg:flex gap-2'>
            <Field>
              <FieldLabel>Дата начала</FieldLabel>
              <ProductValue>{formatDate(routine.start_date)}</ProductValue>
            </Field>
            <Field>
              <FieldLabel>Дата окончания</FieldLabel>
              <ProductValue>{formatDate(routine.end_date)}</ProductValue>
            </Field>
          </div>
          <ProductRow field='Комментарий' value={routine.notes} collapsable />
        </CardContent>

        <CardFooter className='mt-8 flex flex-wrap items-start gap-3'>
          <Link href={`/routine/${id}/edit`}>
            <Button variant='outline'>
              <Pencil />
              Редактировать
            </Button>
          </Link>
          <DuplicateRoutineButton routineId={routine.id} />
          {status === "active" && (
            <FinishRoutineButton
              routineId={routine.id}
              endDate={routine.end_date}
            />
          )}
          <DeleteRoutineDialog
            routineId={routine.id}
            routineName={getRoutineTitle(routine)}
            trigger={
              <Button variant='destructive' className='ml-auto'>
                <Trash />
                Удалить
              </Button>
            }
          />
        </CardFooter>
      </Card>

      {status === "active" && <TodaySection items={routine.items ?? []} />}

      <section className='border-border bg-card rounded-xl border p-4'>
        <h2 className='text-foreground mb-3 text-sm font-semibold'>Состав</h2>
        <RoutineItemsEditor
          routineId={routine.id}
          items={routine.items ?? []}
          productOptions={productOptions}
        />
      </section>

      <section className='border-border bg-card flex flex-col gap-4 rounded-xl border p-4'>
        <h2 className='text-foreground text-sm font-semibold'>Фотографии</h2>
        <RoutinePhotoGrid
          routineId={routine.id}
          photos={routine.photos ?? []}
        />
        <RoutinePhotoCompare photos={routine.photos ?? []} />
      </section>
    </div>
  );
};
