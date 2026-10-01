import { Tables, TablesUpdate } from "@/shared/model";

export type TProduct = Tables<"products"> & {
  imageUrl?: string | null;
};

export type TProductFormValues = TablesUpdate<"products"> & {
  name: string;
};
