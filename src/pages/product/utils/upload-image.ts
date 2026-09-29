import { createServerClient } from "@/shared/server";

const BUCKET_NAME = "product-images";

export const uploadImage = async (
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  formData: FormData,
): Promise<string | null> => {
  const { data } = await supabase.auth.getUser();

  const image = formData.get("image");

  if (image && typeof image === "string" && /^data:image\/[^;]+;base64,/.test(image)) {
    const [header, base64] = image.split(",");

    const contentType = header.match(/data:(.*);base64/)![1];

    const bytes = atob(base64);
    const array = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
      array[i] = bytes.charCodeAt(i);
    }

    const blob = new Blob([array], { type: contentType });

    const ext = image.match(/^data:image\/([^;]+);base64,/)?.[1];

    const fileName = `${crypto.randomUUID()}.${ext}`;
    const path = `${data?.user?.id}/${fileName}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, blob);

    if (error) {
      throw error;
    }

    return path;
  }

  return null;
};