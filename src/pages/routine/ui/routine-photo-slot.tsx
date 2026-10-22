"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { compressImage } from "@/shared/lib/compress-image";
import {
  routinePhotoSlotHints,
  routinePhotoSlots,
  type TPhotoSeries,
  type TPhotoSlot,
  type TRoutinePhoto,
} from "@/entities/routine";
import { deleteRoutinePhoto } from "../api/delete-routine-photo";
import { uploadRoutinePhoto } from "../api/upload-routine-photo";

const readFileAsDataUrl = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });

export const RoutinePhotoSlot = ({
  routineId,
  series,
  slot,
  photo,
}: {
  routineId: string;
  series: TPhotoSeries;
  slot: TPhotoSlot;
  photo?: TRoutinePhoto;
}) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handlePick = () => {
    inputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Можно загрузить только изображение");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const compressed = await compressImage(file);
        const base64 = await readFileAsDataUrl(compressed);

        const formData = new FormData();
        formData.set("routine_id", routineId);
        formData.set("series", series);
        formData.set("slot", slot);
        formData.set("photo", base64);

        const message = await uploadRoutinePhoto(formData);

        if (message) {
          setError(message);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось загрузить фото");
      }

      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!photo) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const message = await deleteRoutinePhoto(photo.id);

      if (message) {
        setError(message);
      }

      router.refresh();
    });
  };

  return (
    <div className='flex flex-col gap-1'>
      <span className='text-muted-foreground truncate text-xs font-medium'>
        {routinePhotoSlots[slot]}
      </span>
      <div className='bg-muted relative aspect-square overflow-hidden rounded-lg border border-border'>
        {photo?.imageUrl ? (
          <Image
            src={photo.imageUrl}
            alt={routinePhotoSlots[slot]}
            width={240}
            height={240}
            className='size-full object-cover'
          />
        ) : (
          <button
            type='button'
            onClick={handlePick}
            disabled={isPending}
            className='text-muted-foreground hover:text-foreground hover:bg-accent flex size-full flex-col items-center justify-center gap-1 p-1 text-center transition-colors'
          >
            <ImagePlus className='size-5 shrink-0' />
            <span className='text-[10px] leading-tight'>
              {isPending ? "Загрузка..." : routinePhotoSlotHints[slot]}
            </span>
          </button>
        )}
      </div>
      <div className='flex gap-1'>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          onClick={handlePick}
          disabled={isPending}
          className='text-muted-foreground h-7 flex-1 px-1 text-xs'
        >
          <Upload className='size-3' />
          {photo ? "Заменить" : "Загрузить"}
        </Button>
        {photo && (
          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={handleDelete}
            disabled={isPending}
            aria-label={`Удалить фото: ${routinePhotoSlots[slot]}`}
            className='text-muted-foreground hover:text-destructive h-7 px-1.5'
          >
            <Trash2 className='size-3' />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";

          if (file) {
            void handleFile(file);
          }
        }}
      />
      {error && (
        <p role='alert' className='text-destructive text-xs'>
          {error}
        </p>
      )}
    </div>
  );
};
