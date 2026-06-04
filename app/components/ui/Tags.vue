<script setup lang="ts">
import type { TProduct } from '~/types/product.types';

const { product } = defineProps<{ product?: TProduct }>();
</script>

<template>
  <div class="flex flex-wrap gap-1.5">
    <span class="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[oklch(0.9_0.08_340)] text-[oklch(0.45_0.1_340)]">{{
      product?.category }}</span>
    <span class="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[oklch(0.9_0.08_200)] text-[oklch(0.45_0.1_200)]">{{
      product?.volume }}</span>
    <span class="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[oklch(0.9_0.08_165)] text-[oklch(0.4_0.1_165)]">{{
      product?.year }}</span>
    <span
      class="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[oklch(0.92_0.08_80)] text-[oklch(0.45_0.12_80)]">{placeholder}</span>
    <span
      class="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[oklch(0.9_0.08_280)] text-[oklch(0.45_0.1_280)]">{placeholder}</span>
  </div>
</template>