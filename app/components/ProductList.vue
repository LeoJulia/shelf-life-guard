<script setup lang="ts">
import type { TProduct } from '~/types/product.types';

const { data, setSearch } = defineProps<{ data?: TProduct[], setSearch: Function }>();

const viewMode = ref('grid');
const setViewMode = (mode: string) => {
  viewMode.value = mode;
}
</script>

<template>
  <Filter :setViewMode :viewMode :setSearch />
  <div v-if="data?.length" class="mt-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-foreground">
        Мои баночки
      </h2>
      <span class="text-sm text-muted-foreground">
        {{ data?.length }} шт
      </span>
    </div>
    <div class="mt-4 grid gap-4" :class="viewMode === 'grid'
      ? 'sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1'">
      <NuxtLink v-for="i in data" :to="{ name: 'product-id', params: { id: i.id } }">
        <ProductCard :product="i" />
      </NuxtLink>
    </div>
  </div>
  <div v-else class="mt-6">
    <div class="mt-12 flex flex-col items-center justify-center text-center">
      <UIcon name="mage:package-box" class="h-12 w-12 text-muted-foreground" />
      <h3 class="mt-4 text-lg font-medium text-foreground">
        No products found
      </h3>
      <p class="mt-1 text-sm text-muted-foreground">
        Try adjusting your search or add a new product.
      </p>
    </div>
  </div>
</template>