"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Images } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  formatRoutineRange,
  getRoutineTitle,
  routinePhotoSeries,
  routinePhotoSeriesOrder,
  routinePhotoSlotOrder,
  routinePhotoSlots,
  type TRoutinePhoto,
} from "@/entities/routine";
import {
  getRoutinePhotosPreview,
  type TRoutinePhotosPreview,
} from "../api/get-routine-photos-preview";
import type { TMonthlyRoutine } from "../api/get-monthly-photos";

/** Все кадры рутины, разложенные по сериям и ракурсам. */
const PreviewPhotos = ({ photos }: { photos: TRoutinePhoto[] }) => {
  const withImage = photos.filter((photo) => photo.imageUrl);

  return (
    <div className='flex flex-col gap-4'>
      {routinePhotoSeriesOrder.map((series) => {
        const seriesPhotos = routinePhotoSlotOrder
          .map((slot) =>
            withImage.find(
              (photo) => photo.series === series && photo.slot === slot,
            ),
          )
          .filter((photo): photo is TRoutinePhoto => Boolean(photo?.imageUrl));

        if (seriesPhotos.length === 0) {
          return null;
        }

        return (
          <section key={series} className='flex flex-col gap-2'>
            <h3 className='text-sm font-semibold'>
              {routinePhotoSeries[series]}
            </h3>
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
              {seriesPhotos.map((photo) => (
                <figure key={photo.slot} className='flex flex-col gap-1'>
                  <figcaption className='text-muted-foreground text-xs'>
                    {routinePhotoSlots[photo.slot]}
                  </figcaption>
                  <Image
                    src={photo.imageUrl as string}
                    alt={`${routinePhotoSlots[photo.slot]} — ${routinePhotoSeries[series]}`}
                    width={240}
                    height={240}
                    className='aspect-square size-full rounded-lg object-cover'
                  />
                </figure>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export const RoutinePhotoCard = ({ routine }: { routine: TMonthlyRoutine }) => {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<TRoutinePhotosPreview | null>(null);
  const [loading, setLoading] = useState(false);

  const title = getRoutineTitle({
    name: routine.name,
    start_date: routine.startDate,
  });
  const range = formatRoutineRange({
    start_date: routine.startDate,
    end_date: routine.endDate,
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);

    if (next && !preview && !loading) {
      setLoading(true);
      void getRoutinePhotosPreview(routine.routineId)
        .then(setPreview)
        .finally(() => setLoading(false));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type='button'
          className='flex flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-colors hover:border-primary/50'
        >
          <span className='bg-muted relative aspect-square w-full'>
            {routine.thumbUrl ? (
              <Image
                src={routine.thumbUrl}
                alt={title}
                fill
                className='object-cover'
              />
            ) : (
              <span className='text-muted-foreground flex size-full items-center justify-center'>
                <Images className='size-6' />
              </span>
            )}
          </span>
          <span className='flex flex-col gap-0.5 p-3'>
            <span className='truncate text-sm font-medium'>{title}</span>
            <span className='text-muted-foreground truncate text-xs'>
              {range}
            </span>
            <span className='text-muted-foreground text-xs'>
              {routine.photoCount} фото
            </span>
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{range}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton
                key={index}
                className='aspect-square w-full rounded-lg'
              />
            ))}
          </div>
        ) : preview && preview.photos.length > 0 ? (
          <PreviewPhotos photos={preview.photos} />
        ) : (
          <p className='text-muted-foreground text-sm'>Фотографий нет</p>
        )}

        <DialogFooter>
          <Button asChild>
            <Link href={`/routine/${routine.routineId}`}>Открыть рутину</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
