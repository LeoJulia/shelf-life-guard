"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import type { TTagSummary } from "@/entities/tag";
import { darkenHex } from "@/shared/utils";
import { usePendingAction } from "@/shared/lib/use-pending-action";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { createTag, type TTagFormState } from "../api/create-tag";
import { deleteTag } from "../api/delete-tag";

const INITIAL_STATE: TTagFormState = { message: null };

export function TagsCard({ tags }: { tags: TTagSummary[] }) {
  const [state, formAction] = useActionState(createTag, INITIAL_STATE);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { error, isLoading, run } = usePendingAction({
    fallbackMessage: "Не удалось удалить тег",
    mapError: () => "Не удалось удалить тег",
  });

  const handleDelete = (tag: TTagSummary) => {
    if (
      !window.confirm(
        `Удалить тег «${tag.name}»? Он пропадёт из всех продуктов.`,
      )
    ) {
      return;
    }

    setDeletingId(tag.id);
    void run(async () => {
      try {
        await deleteTag(tag.id);
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl'>Теги</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col gap-4'>
          {tags.length === 0 ? (
            <p className='text-sm text-muted-foreground'>Тегов пока нет</p>
          ) : (
            <div className='flex flex-wrap gap-1.5'>
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className='flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground'
                  style={
                    tag.color
                      ? {
                          backgroundColor: tag.color,
                          color: darkenHex(tag.color),
                        }
                      : undefined
                  }
                >
                  {tag.name}
                  <button
                    type='button'
                    aria-label={`Удалить тег ${tag.name}`}
                    className='rounded-full p-0.5 hover:bg-black/10 disabled:opacity-50'
                    disabled={isLoading && deletingId === tag.id}
                    onClick={() => handleDelete(tag)}
                  >
                    <X className='size-3' />
                  </button>
                </span>
              ))}
            </div>
          )}

          <form action={formAction}>
            <div className='grid gap-2'>
              <div className='flex gap-2'>
                <Input
                  name='name'
                  placeholder='Новый тег'
                  maxLength={50}
                  required
                />
                <Button type='submit'>Добавить</Button>
              </div>
            </div>
          </form>

          {error && <p className='text-sm text-destructive'>{error}</p>}
          {state.message && (
            <p className='text-sm text-muted-foreground'>{state.message}</p>
          )}
          <p className='text-xs text-muted-foreground'>
            Удаление тега необратимо — он автоматически пропадёт из всех
            продуктов.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
