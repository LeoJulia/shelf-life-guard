<script setup lang="ts">
import { useFilterStore } from "~/stores/filterStore";
import type { TProduct } from "~/types/product.types";

const products = ref();
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
} = storeToRefs(filterStore);

watchEffect(async () => {
  const { data } = await useFetch<TProduct[]>("/api/product-list", {
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
    },
  });

  products.value = data;
});
</script>

<template>
  <main class="mx-auto max-w-7xl px-6 py-8">
    <div v-if="products">
      <Statistic />
      <ProductList :data="products?.value" />
      <SidebarFilter />
    </div>
  </main>
</template>
