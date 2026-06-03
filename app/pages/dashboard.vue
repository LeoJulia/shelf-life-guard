<script setup lang="ts">
const { data } = await useFetch('/api/product-list');
</script>

<template>
  <main class="mx-auto max-w-7xl px-6 py-8">
    <ProductList :data="data" />
  </main>
</template>