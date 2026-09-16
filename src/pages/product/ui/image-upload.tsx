"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { compressImage } from "../utils/compress-image";

interface ImageUploadProps {
  /** Base64 или URL текущего изображения */
  value: string;
  /** Имя поля для FormData (по умолчанию "image") */
  name?: string;
  /** Текст-заглушка когда изображения нет */
  emptyLabel?: string;
}

/**
 * Компонент для выбора и предпросмотра изображения.
 * Хранит значение в скрытом input, чтобы оно попадало в FormData формы.
 */
export function ImageUpload({
  value,
  name = "image",
  emptyLabel = "Нет изображения",
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgValue, setImgValue] = useState<string>(value);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа
    if (!file.type.startsWith("image/")) {
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setImgValue(result);
      }
    };
    reader.onerror = () => {
      // тихо игнорируем ошибку чтения
    };
    const compressedFile = await compressImage(file);
    reader.readAsDataURL(compressedFile);

    // Сбрасываем значение input, чтобы можно было выбрать тот же файл повторно
    e.target.value = "";
  };

  const handleRemove = () => {
    setImgValue("");
  };

  const handlePick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className='relative w-full max-w-xs'>
      {/* Скрытый input для FormData */}
      <Input type='hidden' name={name} value={imgValue} />

      {/* Превью */}
      <div className='aspect-[3/4] w-full rounded-2xl border flex items-center justify-center overflow-hidden'>
        {imgValue ? (
          <Image
            src={imgValue}
            alt=''
            width={615}
            height={832}
            className='w-full h-auto object-contain rounded-2xl'
          />
        ) : (
          <div className='text-muted-foreground text-sm flex flex-col items-center gap-2'>
            <ImageIcon className='size-10' />
            <span>{emptyLabel}</span>
          </div>
        )}
      </div>

      {/* Кнопки управления */}
      <div className='flex gap-2 mt-3'>
        <Button
          type='button'
          onClick={handlePick}
          className='flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-colors'
        >
          <Upload className='size-4' />
          {imgValue ? "Заменить" : "Загрузить"}
        </Button>
        {imgValue && (
          <Button
            type='button'
            onClick={handleRemove}
            aria-label='Удалить изображение'
            variant='destructive'
            className='px-3 py-2 text-sm rounded-xl transition-colors'
          >
            <Trash2 className='size-4' />
          </Button>
        )}
      </div>

      {/* Скрытый file input */}
      <Input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        onChange={handleFileChange}
        className='hidden'
      />

      <p className='text-xs text-muted-foreground mt-2'>
        Поддерживаются JPG, PNG, WebP.
      </p>
    </div>
  );
}
