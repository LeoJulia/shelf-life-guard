import imageCompression from "browser-image-compression";

/**
 * Сжимает изображение до ≤0.5 МБ и конвертирует в webp.
 *
 * Используется на клиенте перед превращением файла в base64 для server action.
 */
export async function compressImage(file: File) {
  return imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: "image/webp",
  });
}
