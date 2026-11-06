"use server";

import {
  createServerClient,
  releaseUploadedImage,
  scheduleStorageMaintenance,
} from "@/shared/server";
import { buildProductTags } from "@/entities/tag";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadBase64Image } from "@/shared/lib/upload-image";
import { PRODUCT_IMAGES_BUCKET } from "@/shared/lib/buckets";
import {
  parseProductFormData,
  parseProductTags,
} from "../utils/parse-form-data";
import { revalidateProductLists } from "../utils/revalidate";

export const updateProduct = async (id: string, formData: FormData) => {
  const supabase = await createServerClient();
  const updateProduct = parseProductFormData(formData);

  const rawImage = formData.get("image");

  const imgPath = await uploadBase64Image(
    supabase,
    PRODUCT_IMAGES_BUCKET,
    formData,
  );

  // Три состояния поля: base64 (замена — уже загружена), непустая строка
  // (URL текущего фото — оставить), пустая строка (фото удалено кнопкой).
  const imagePatch = imgPath
    ? { image_path: imgPath }
    : rawImage === ""
      ? { image_path: null }
      : {};

  try {
    const { error } = await supabase.rpc("save_product_with_tags", {
      p_product_id: id,
      p_values: {
        ...updateProduct,
        ...imagePatch,
      },
      p_tags: buildProductTags(parseProductTags(formData)),
    });

    if (error) {
      throw new Error("Update product error", { cause: error });
    }
  } catch (error) {
    if (imgPath) {
      await releaseUploadedImage(supabase, PRODUCT_IMAGES_BUCKET, imgPath);
    }

    throw error;
  } finally {
    scheduleStorageMaintenance();
  }

  revalidatePath(`/product/${id}/edit`, "page");
  revalidatePath(`/product/${id}`, "page");

  revalidateProductLists();

  redirect(`/product/${id}`);
};
