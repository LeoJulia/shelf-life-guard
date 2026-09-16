import { createServerClient } from "@/shared/server";

const BUCKET_NAME = "product-images";
const SIGNED_URL_EXPIRY = 3600;

export const fetchProductImageUrl = async (
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  imagePath: string | null,
): Promise<string | undefined> => {
  if (!imagePath) {
    return undefined;
  }

  const { data } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(imagePath, SIGNED_URL_EXPIRY);

  return data?.signedUrl;
};