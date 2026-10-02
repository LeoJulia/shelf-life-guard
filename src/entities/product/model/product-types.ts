import { Tables, TablesUpdate, TProductTag } from "@/shared/model";

export type TProduct = Tables<"products"> & {
  imageUrl?: string | null;
  tags?: TProductTag[];
};

export type TProductFormValues = TablesUpdate<"products"> & {
  name: string;
};
