export { ProductList } from "./ui";
// Серверный вход виджета: выборка списка продуктов для страниц (dashboard,
// products, analytics). Живёт здесь, а не в entities/product, чтобы барель
// сущности оставался клиентобезопасным (без next/headers).
export { getProductList } from "./api";
