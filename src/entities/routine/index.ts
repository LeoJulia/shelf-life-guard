/**
 * Публичный API среза routine.
 *
 * Намеренно НЕ содержит сегмента api: серверные выборки живут в
 * src/pages/routine/api/ (прецедент — src/pages/product/api/get-product.ts).
 * Благодаря этому барель не тянет @/shared/server → next/headers и его можно
 * безопасно импортировать из клиентских компонентов.
 */
export * from "./model";
export * from "./lib";
export * from "./config";
export * from "./ui";
