<script setup lang="ts">
import Loader from "~/components/ui/Loader.vue";
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

const { data: products, pending } = await useFetch<TProduct[]>("/api/product-list", {
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

const viewMode = ref<"grid" | "list">("grid");
const setViewMode = (mode: "grid" | "list") => {
  viewMode.value = mode;
};
</script>

<template>
  <div class="mx-auto max-w-7xl px-6 py-8">
    <Statistic />
    <Filter :setViewMode :viewMode />
    <ClientOnly>
      <Loader v-if="pending" />
      <ProductList v-else :data="products" :viewMode />
    </ClientOnly>
    <SidebarFilter />
  </div>
</template>
