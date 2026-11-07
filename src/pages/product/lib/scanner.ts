"use client";

import type {
  BrowserMultiFormatReader,
  IScannerControls,
} from "@zxing/browser";
import type { Result } from "@zxing/library";
import { BARCODE_FORMATS } from "../config/barcode";

export type ScanResult = { code: string };

export interface Scanner {
  /** Запускает распознавание с камеры в <video>. Резолвится, когда поток готов. */
  startLive(
    video: HTMLVideoElement,
    onCode: (r: ScanResult) => void,
  ): Promise<void>;
  /** Останавливает камеру/декодер. */
  stop(): void;
  /** Распознаёт штрих-код из файла-изображения. null — если кода нет. */
  scanFile(file: File): Promise<ScanResult | null>;
}

/* ---------- Нативный BarcodeDetector (Chrome/Edge/Android) ---------- */

type NativeBarcode = { rawValue: string; format: string };
type NativeDetector = {
  detect: (source: CanvasImageSource) => Promise<NativeBarcode[]>;
};
type NativeDetectorCtor = {
  new (opts?: { formats?: string[] }): NativeDetector;
  getSupportedFormats(): Promise<string[]>;
};

const getNativeDetector = async (): Promise<NativeDetector | null> => {
  if (typeof window === "undefined") return null;

  const Ctor = (window as unknown as { BarcodeDetector?: NativeDetectorCtor })
    .BarcodeDetector;
  if (!Ctor) return null;

  try {
    const supported = await Ctor.getSupportedFormats();
    const formats = BARCODE_FORMATS.filter((f) => supported.includes(f));
    if (formats.length === 0) return null;
    return new Ctor({ formats });
  } catch {
    return null;
  }
};

class NativeScanner implements Scanner {
  private stream?: MediaStream;
  private timer?: ReturnType<typeof setTimeout>;
  private stopped = false;

  constructor(private readonly detector: NativeDetector) {}

  async startLive(video: HTMLVideoElement, onCode: (r: ScanResult) => void) {
    this.stopped = false;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });

    // stop() мог сработать, пока ждали разрешение камеры: поздний поток
    // останавливаем сразу, иначе камера осталась бы включённой навсегда.
    if (this.stopped) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    this.stream = stream;
    video.srcObject = stream;
    try {
      await video.play();
    } catch (error) {
      this.stop();
      throw error;
    }
    if (this.stopped) return;

    const loop = async () => {
      if (this.stopped) return;
      try {
        const codes = await this.detector.detect(video);
        if (codes.length > 0) {
          onCode({ code: codes[0].rawValue });
          return;
        }
      } catch {
        /* кадр ещё не готов — пробуем следующий */
      }
      this.timer = setTimeout(loop, 250);
    };
    void loop();
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = undefined;
  }

  async scanFile(file: File): Promise<ScanResult | null> {
    const bitmap = await createImageBitmap(file);
    try {
      const codes = await this.detector.detect(bitmap);
      return codes.length > 0 ? { code: codes[0].rawValue } : null;
    } finally {
      bitmap.close();
    }
  }
}

/* ---------- Фолбэк: ZXing (Firefox/Safari и т.п.) ---------- */

class ZxingScanner implements Scanner {
  private reader?: BrowserMultiFormatReader;
  private controls?: IScannerControls;
  private stopped = false;

  private async getReader(): Promise<BrowserMultiFormatReader> {
    if (this.reader) return this.reader;

    const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] =
      await Promise.all([import("@zxing/browser"), import("@zxing/library")]);

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    this.reader = new BrowserMultiFormatReader(hints);
    return this.reader;
  }

  async startLive(video: HTMLVideoElement, onCode: (r: ScanResult) => void) {
    this.stopped = false;
    const reader = await this.getReader();
    if (this.stopped) return;

    const controls = await reader.decodeFromVideoDevice(
      undefined,
      video,
      (result: Result | undefined, _err, controls: IScannerControls) => {
        if (this.stopped) {
          controls.stop();
          return;
        }
        if (result) {
          onCode({ code: result.getText() });
          controls.stop();
        }
      },
    );

    // decodeFromVideoDevice резолвится поздно: если stop() уже вызвали,
    // останавливаем только что полученные controls вместе с потоком камеры.
    if (this.stopped) {
      controls.stop();
      return;
    }
    this.controls = controls;
  }

  stop() {
    this.stopped = true;
    this.controls?.stop();
    this.controls = undefined;
  }

  async scanFile(file: File): Promise<ScanResult | null> {
    const reader = await this.getReader();
    const url = URL.createObjectURL(file);
    try {
      const result = await reader.decodeFromImageUrl(url);
      return result ? { code: result.getText() } : null;
    } catch {
      return null; // NotFoundException и пр.
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/* ---------- Фабрика ---------- */

/** Нативный детектор, если браузер его поддерживает; иначе ZXing. */
export const createScanner = async (): Promise<Scanner> => {
  const detector = await getNativeDetector();
  return detector ? new NativeScanner(detector) : new ZxingScanner();
};

export const hasCameraSupport = (): boolean =>
  typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
