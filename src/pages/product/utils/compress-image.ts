import imageCompression from "browser-image-compression";

export async function compressImage(file: File) {
  return imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: "image/webp",
  });
}
