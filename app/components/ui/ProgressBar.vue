<script setup lang="ts">
import type { TProduct } from '~/types/product.types';

const { product } = defineProps<{ product?: TProduct }>();

const progress = computed(() => product?.expiry_date ? Math.round(Math.max(
  0,
  Math.min(
    100,
    ((new Date(product?.expiry_date).getTime() - new Date().getTime()) / (90 * 8.64e+7)) * 100
  ))) : 0);
</script>

<template>
  <div class="mt-4" v-if="product?.expiry_date && !product.finished_at">
    <div class="flex items-center justify-between text-xs text-muted-foreground">
      <span>Срок годности</span>
      <span class="font-medium text-foreground">
        {{
          new Date(product.expiry_date).toLocaleDateString("ru-RU", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        }} {{ progress }}%
      </span>
    </div>
    <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-[oklch(0.92_0.04_340)]">
      <div
        class="h-full rounded-full bg-gradient-to-r from-[oklch(0.8_0.1_340)] to-[oklch(0.85_0.08_200)] transition-all duration-500"
        :style="{ width: progress + '%' }" />
    </div>
  </div>
</template>