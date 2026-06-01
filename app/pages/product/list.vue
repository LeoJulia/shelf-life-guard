<script setup lang="ts">
const { data } = await useFetch('/api/product-list');
</script>

<template>
  <div class="m-8" v-for="i in data">
    <NuxtLink :to="{ name: 'product-id', params: { id: i.id } }">{{ i.brand }} - {{ i.productName }}</NuxtLink>
  </div>
</template>