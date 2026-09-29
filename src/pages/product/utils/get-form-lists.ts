import {
  getBrandsList,
  getCategoriesList,
  getShopsList,
  getVolumesList,
} from "@/entities/filter";

export type TProductFormLists = {
  brandsList: string[];
  categoriesList: string[];
  volumesList: string[];
  shopsList: string[];
};

export const getProductFormLists = async (): Promise<TProductFormLists> => {
  const [brandsList, categoriesList, volumesList, shopsList] = await Promise.all([
    getBrandsList(),
    getCategoriesList(),
    getVolumesList(),
    getShopsList(),
  ]);

  return { brandsList, categoriesList, volumesList, shopsList };
};