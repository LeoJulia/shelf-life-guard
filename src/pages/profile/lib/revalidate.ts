import { revalidatePath } from "next/cache";

/**
 * Теги участвуют в фильтре и чипах продуктов, поэтому после создания/удаления
 * тега нужно инвалидировать и списки продуктов, и сам кабинет.
 */
export const revalidateTags = () => {
  revalidatePath("/profile/tags");
  revalidatePath("/dashboard", "page");
  revalidatePath("/products", "page");
  revalidatePath("/", "page");
};
