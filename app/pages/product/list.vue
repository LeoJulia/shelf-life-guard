<script setup lang="ts">
const { data } = await useFetch('/api/product-list');

const onClickHandler = (id: string) => {
  navigateTo(`/product/${id}`);
}
</script>

<template>
  <div class="m-8" v-for="i in data">
    <div @click="onClickHandler(i.id)">{{ i.brand }} - {{ i.productName }}</div>
  </div>
</template>