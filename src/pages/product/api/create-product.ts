"use server";

import {
  createServerClient,
  releaseUploadedImage,
  scheduleStorageMaintenance,
} from "@/shared/server";
import { buildProductTags } from "@/entities/tag";
import { redirect } from "next/navigation";
import { uploadBase64Image } from "@/shared/lib/upload-image";
import { PRODUCT_IMAGES_BUCKET } from "@/shared/lib/buckets";
import {
  parseProductFormData,
  parseProductTags,
} from "../utils/parse-form-data";
import { revalidateProductLists } from "../utils/revalidate";

export const createProduct = async (formData: FormData) => {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    throw new Error("Create product error: user is not authenticated");
  }

  const newProduct = {
    ...parseProductFormData(formData),
    year: new Date().getFullYear(),
  };

  const imgPath = await uploadBase64Image(
    supabase,
    PRODUCT_IMAGES_BUCKET,
    formData,
  );

  let productId: string;

  try {
    const { data: savedProductId, error } = await supabase.rpc(
      "save_product_with_tags",
      {
        p_values: {
          ...newProduct,
          ...(imgPath ? { image_path: imgPath } : {}),
        },
        p_tags: buildProductTags(parseProductTags(formData)),
      },
    );

    if (error || !savedProductId) {
      throw new Error("Create product error", { cause: error });
    }

    productId = savedProductId;
  } catch (error) {
    if (imgPath) {
      await releaseUploadedImage(supabase, PRODUCT_IMAGES_BUCKET, imgPath);
    }

    throw error;
  } finally {
    scheduleStorageMaintenance();
  }

  revalidateProductLists();

  redirect(`/product/${productId}`);
};
