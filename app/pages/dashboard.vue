<script setup lang="ts">
import type { TProduct } from '~/types/product.types';

const search = ref<string>('');
const setSearch = (event) => {
  console.log('searchString', event.target.value);
  search.value = event.target.value;
}

const { data } = await useFetch<TProduct[]>('/api/product-list', {
  query: { search },
});
</script>

<template>
  <main class="mx-auto max-w-7xl px-6 py-8">
    <Statistic />
    <ProductList :data="data" :setSearch />
  </main>
</template>