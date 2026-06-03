<script setup lang="ts">
import type { TProduct } from '~/types/product.types';

const { data } = defineProps<{ data?: TProduct[] }>();
</script>

<template>
  <div class="mt-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-foreground">
        Мои баночки
      </h2>
      <span class="text-sm text-muted-foreground">
        {{ data?.length }} шт
      </span>
    </div>
    <div class="mt-4 grid gap-4 grid-cols-1" v-for="i in data">
      <NuxtLink :to="{ name: 'product-id', params: { id: i.id } }">
        <!-- {{ i.brand }} - {{ i.name }} -->
        <ProductCard :product="i" />
      </NuxtLink>
    </div>
  </div>
</template>