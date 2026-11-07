/**
 * Публичный API среза product — клиентобезопасный.
 *
 * Намеренно НЕ реэкспортирует серверные выборки: getProductList живёт в
 * widgets/product-list/api, getProductOptions — в pages/routine/api (прецедент
 * среза routine). Благодаря этому барель не тянет @/shared/server → next/headers
 * и его можно безопасно импортировать из клиентских компонентов, не обходя
 * public API через сегменты ui/model.
 */
export * from "./model";
export * from "./lib";
export * from "./ui";
