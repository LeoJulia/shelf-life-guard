import type { Database } from "./database.types";

export type TProduct = Database["public"]["Tables"]["products"]["Row"] & {
  imageUrl?: string;
};
