<script setup lang="ts">
import { useFilterStore } from "~/stores/filterStore";
import type { TProduct } from "~/types/product.types";

const filterStore = useFilterStore();
const {
  searchQuery,
  filterBrand,
  filterCategory,
  filterShop,
  priceRange,
  isOpenProducts,
  isCloseProducts,
  isFinishedProducts,
  isTermLessThan30Days,
  isTermLessThan90Days,
  sort,
} = storeToRefs(filterStore);

const { data: products } = await useFetch<TProduct[]>("/api/product-list", {
  query: {
    searchQuery,
    brands: filterBrand,
    categories: filterCategory,
    shops: filterShop,
    minPrice: priceRange.value[0],
    maxPrice: priceRange.value[1],
    isOpenProducts,
    isCloseProducts,
    isFinishedProducts,
    isTermLessThan30Days,
    isTermLessThan90Days,
    sort,
  },
});
</script>

<template>
  <div class="mx-auto max-w-7xl px-6 py-8">
    <div v-if="products">
      <Statistic />
      <ProductList :data="products" />
      <SidebarFilter />
    </div>
  </div>
</template>
