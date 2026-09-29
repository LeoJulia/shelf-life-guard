import { Tables } from "@/shared/model";

export type TProduct = Tables<"products"> & {
  imageUrl?: string;
};
