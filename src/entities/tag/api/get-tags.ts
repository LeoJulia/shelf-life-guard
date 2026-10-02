import { createServerClient } from "@/shared/server";
import { TProductTag } from "../model";

export const getTagsList = async (): Promise<string[]> => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("tags")
    .select("name")
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Error get tags list", { cause: error });
  }

  return data.map(({ name }) => name).filter(Boolean);
};

export const getProductTags = async (
  productId: string,
): Promise<TProductTag[]> => {
  if (!productId) {
    return [];
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("product_tags")
    .select("tags(name, color)")
    .eq("product_id", productId);

  if (error) {
    throw new Error("Error get product tags", { cause: error });
  }

  return (data ?? [])
    .map((row) => (row as { tags?: TProductTag | null }).tags)
    .filter((tag): tag is TProductTag => Boolean(tag?.name));
};
