"use client";

import { useActionState, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { CollapsibleTextarea } from "@/shared/ui/collapsible-textarea";
import type { TRoutine, TRoutineFormState } from "@/entities/routine";
import { createRoutine } from "../api/create-routine";
import { updateRoutine } from "../api/update-routine";
import { EMPTY_ROUTINE } from "../lib/empty-routine";
import { RoutineFormFooter } from "./routine-form-footer";

const INITIAL_STATE: TRoutineFormState = { error: null };

export const RoutineForm = ({ routine }: { routine?: TRoutine }) => {
  const current = routine ?? EMPTY_ROUTINE;

  // Поля контролируемые: после неудачной отправки server action возвращает
  // состояние, и неконтролируемые inputs сбрасывались к серверным значениям,
  // теряя ввод пользователя.
  const [name, setName] = useState(current.name ?? "");
  const [startDate, setStartDate] = useState(current.start_date);
  const [endDate, setEndDate] = useState(current.end_date ?? "");

  const [state, formAction] = useActionState(
    routine ? updateRoutine.bind(null, routine.id) : createRoutine,
    INITIAL_STATE,
  );

  const title = routine ? "Редактирование рутины" : "Новая рутина";

  return (
    <Card className='group relative overflow-hidden rounded-xl border-border bg-card'>
      <form action={formAction}>
        <CardHeader>
          <CardTitle className='text-xl font-bold text-foreground'>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className='max-w-2xl space-y-4'>
          <FieldGroup>
            <Field orientation='horizontal'>
              <FieldLabel htmlFor='name'>Название</FieldLabel>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                id='name'
                name='name'
                placeholder='Например: Летний курс с ретинолом'
              />
            </Field>

            <div className='lg:flex gap-2'>
              <Field>
                <FieldLabel htmlFor='start_date'>Дата начала</FieldLabel>
                <Input
                  className='justify-end'
                  id='start_date'
                  name='start_date'
                  type='date'
                  required
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor='end_date'>Дата окончания</FieldLabel>
                <Input
                  className='justify-end'
                  id='end_date'
                  name='end_date'
                  type='date'
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </Field>
            </div>

            <Field orientation='horizontal'>
              <FieldLabel htmlFor='notes' className='pt-2'>
                Комментарий
              </FieldLabel>
              <FieldContent>
                <CollapsibleTextarea
                  id='notes'
                  name='notes'
                  defaultValue={current.notes}
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className='flex-col items-stretch gap-3'>
          <RoutineFormFooter
            cancelHref={routine ? `/routine/${routine.id}` : "/routine"}
          />
          {state.error && (
            <div
              role='alert'
              className='rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive'
            >
              {state.error}
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};
