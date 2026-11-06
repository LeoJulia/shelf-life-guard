import type { TProduct } from "../model";

/**
 * Расход относится к году добавления продукта (products.year), а не к году
 * открытия: неоткрытая покупка этого года — расход этого года, а старая покупка,
 * открытая сейчас, — расход своего года.
 */
export const isSpentInYear = (
  product: Pick<TProduct, "year">,
  year: number,
): boolean => product.year === year;
