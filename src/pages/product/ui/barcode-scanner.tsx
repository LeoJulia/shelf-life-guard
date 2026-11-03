"use client";

import { useCallback, useRef, useState } from "react";
import { Barcode, Camera, CameraOff, Loader2, Search, Upload } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import { lookupBarcode } from "../api/lookup-barcode";
import { createScanner, hasCameraSupport, type Scanner } from "../lib/scanner";
import { compressImage } from "@/shared/lib/compress-image";
import type { TScannedProduct } from "../model/barcode-types";

interface BarcodeScannerProps {
  onFound: (product: TScannedProduct) => void;
}

/**
 * Прогоняет скачанное фото через общий бюджет изображений приложения
 * (≤0.5 МБ webp), чтобы сабмит формы не упёрся в лимит тела server action.
 */
const compressDataUrl = async (
  dataUrl: string,
): Promise<string | undefined> => {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "scan", { type: blob.type });
    const compressed = await compressImage(file);

    return await new Promise<string | undefined>((resolve) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : undefined);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(compressed);
    });
  } catch {
    return undefined;
  }
};

export function BarcodeScanner({ onFound }: BarcodeScannerProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Scanner | null>(null);

  const stopCamera = useCallback(() => {
    scannerRef.current?.stop();
    scannerRef.current = null;
    setCameraOn(false);
  }, []);

  const handleCode = useCallback(
    async (rawCode: string) => {
      const code = rawCode.replace(/\D/g, "");
      if (!code) return;

      stopCamera();
      setBusy(true);
      setMessage("Ищу продукт…");

      try {
        const result = await lookupBarcode(code);

        if (result.found) {
          if (result.product.imageBase64) {
            result.product.imageBase64 = await compressDataUrl(
              result.product.imageBase64,
            );
          }
          setMessage(null);
          setManualCode("");
          setOpen(false);
          onFound(result.product);
        } else if (result.reason === "source_error") {
          setMessage(
            "Сервис поиска временно недоступен — попробуйте позже или введите вручную.",
          );
        } else {
          setMessage(`Код ${code} не найден — заполните поля вручную.`);
        }
      } catch {
        setMessage(
          "Не удалось выполнить поиск. Проверьте соединение и попробуйте ещё раз.",
        );
      } finally {
        setBusy(false);
      }
    },
    [onFound, stopCamera],
  );

  const startCamera = useCallback(async () => {
    setMessage(null);
    try {
      const scanner = await createScanner();
      scannerRef.current = scanner;
      setCameraOn(true);
      if (videoRef.current) {
        await scanner.startLive(videoRef.current, (r) => void handleCode(r.code));
      }
    } catch {
      setCameraOn(false);
      setMessage("Не удалось включить камеру. Введите код вручную.");
    }
  }, [handleCode]);

  const handleManual = useCallback(() => {
    if (!busy) void handleCode(manualCode);
  }, [busy, handleCode, manualCode]);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || busy) return;

      setBusy(true);
      setMessage("Распознаю штрих-код на фото…");

      const scanner = await createScanner();
      const result = await scanner.scanFile(file).catch(() => null);

      setBusy(false);
      if (result?.code) {
        await handleCode(result.code);
      } else {
        setMessage("Штрих-код на фото не распознан. Попробуйте ещё раз.");
      }
    },
    [busy, handleCode],
  );

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) {
        stopCamera();
        setMessage(null);
      }
    },
    [stopCamera],
  );

  const cameraAvailable = hasCameraSupport();

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <Button type='button' variant='outline' className='gap-2'>
          <Barcode className='size-4' />
          Сканировать штрих-код
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Поиск по штрих-коду</DrawerTitle>
          <DrawerDescription>
            Отсканируйте EAN-13, чтобы заполнить поля автоматически. Данные
            можно поправить вручную.
          </DrawerDescription>
        </DrawerHeader>

        <div className='flex flex-col gap-4 px-4 overflow-y-auto'>
          {cameraAvailable && (
            <div className='flex flex-col gap-2'>
              <div className='relative h-40 w-full overflow-hidden rounded-xl border bg-muted flex items-center justify-center'>
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className={`h-full w-full object-cover ${cameraOn ? "" : "hidden"}`}
                />
                {!cameraOn && (
                  <span className='text-sm text-muted-foreground'>
                    Камера выключена
                  </span>
                )}
              </div>
              <Button
                type='button'
                variant='secondary'
                className='gap-2'
                disabled={busy}
                onClick={() => (cameraOn ? stopCamera() : void startCamera())}
              >
                {cameraOn ? (
                  <CameraOff className='size-4' />
                ) : (
                  <Camera className='size-4' />
                )}
                {cameraOn ? "Выключить камеру" : "Включить камеру"}
              </Button>
            </div>
          )}

          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground'>
              <Upload className='size-4' />
            </span>
            <Button
              type='button'
              variant='ghost'
              className='gap-2'
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              Распознать с фото
            </Button>
            <input
              ref={fileRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleFile}
            />
          </div>

          <div className='flex items-center gap-2'>
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManual()}
              inputMode='numeric'
              placeholder='Или введите код вручную (13 цифр)'
              aria-label='Штрих-код вручную'
            />
            <Button
              type='button'
              className='gap-2 shrink-0'
              disabled={busy}
              onClick={handleManual}
            >
              {busy ? <Loader2 className='size-4 animate-spin' /> : <Search className='size-4' />}
              Найти
            </Button>
          </div>

          {message && (
            <p className='text-sm text-muted-foreground' role='status'>
              {message}
            </p>
          )}
        </div>

        <DrawerFooter>
          <p className='text-xs text-muted-foreground'>
            Данные: Open Beauty Facts / Open Food Facts (ODbL)
          </p>
          <DrawerClose asChild>
            <Button type='button' variant='outline'>
              Закрыть
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
