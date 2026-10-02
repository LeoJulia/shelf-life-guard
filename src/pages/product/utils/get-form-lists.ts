import {
  getBrandsList,
  getCategoriesList,
  getShopsList,
  getVolumesList,
} from "@/entities/filter";
import { getTagsList } from "@/entities/tag";

export type TProductFormLists = {
  brandsList: string[];
  categoriesList: string[];
  volumesList: string[];
  shopsList: string[];
  tagsList: string[];
};

export const getProductFormLists = async (): Promise<TProductFormLists> => {
  const [brandsList, categoriesList, volumesList, shopsList, tagsList] =
    await Promise.all([
      getBrandsList(),
      getCategoriesList(),
      getVolumesList(),
      getShopsList(),
      getTagsList(),
    ]);

  return { brandsList, categoriesList, volumesList, shopsList, tagsList };
};