<script setup lang="ts">
import type { TProduct } from '~/types/product.types';

const { data } = await useFetch<TProduct[]>('/api/product-list');
</script>

<template>
  <main class="mx-auto max-w-7xl px-6 py-8">
    <ProductList :data="data" />
  </main>
</template>