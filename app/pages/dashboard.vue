<script setup lang="ts">
import { useFilterStore } from '~/stores/filterStore';
import type { TProduct } from '~/types/product.types';

const filterStore = useFilterStore();
const { searchQuery } = storeToRefs(filterStore);

const { data } = await useFetch<TProduct[]>('/api/product-list', {
  query: { searchQuery },
});
</script>

<template>
  <main class="mx-auto max-w-7xl px-6 py-8">
    <Statistic />
    <ProductList :data="data" />
  </main>
</template>