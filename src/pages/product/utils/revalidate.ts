import { revalidatePath } from "next/cache";

export const revalidateProductLists = () => {
  revalidatePath("/dashboard", "page");
  revalidatePath("/products", "page");
  revalidatePath("/", "page");
};