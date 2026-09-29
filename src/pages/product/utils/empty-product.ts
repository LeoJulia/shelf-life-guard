import { TProduct } from "@/entities/product";

export const EMPTY_PRODUCT: Omit<TProduct, "user_id"> = {
  id: "",
  brand: "",
  name: "",
  category: "",
  volume: null,
  market_price: null,
  actual_price: null,
  shop: null,
  rating: null,
  expiry_date: null,
  opened_at: null,
  finished_at: null,
  ingredients: null,
  notes: null,
  image_path: null,
  created_at: null,
  year: null,
};
