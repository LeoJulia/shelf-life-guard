<script setup lang="ts">
import type { TProduct } from "~/types/product.types";
import Rating from "./ui/Rating.vue";
import ProgressBar from "./ui/ProgressBar.vue";
import Tags from "./ui/Tags.vue";

const { product } = defineProps<{ product?: TProduct }>();

const lastDate = product?.finished_at ? new Date(product.finished_at) : new Date();
const costPerDay = product?.opened_at
  ? (product?.actual_price ?? 0) /
    ((lastDate.getTime() - new Date(product.opened_at).getTime()) / 8.64e7)
  : null;
</script>

<template>
  <div
    v-if="product"
    class="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
  >
    <div class="flex gap-4">
      <!-- {/* Product Image */} -->
      <div class="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-input">
        <img
          :src="product?.imageUrl"
          :alt="product.name"
          fill
          class="object-cover transition-transform duration-300 group-hover:scale-105 h-full"
        />
      </div>

      <!-- {/* Product Info */} -->
      <div class="flex flex-1 flex-col">
        <span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {{ product.brand }}
        </span>
        <h3 class="mt-0.5 text-base font-semibold leading-tight text-foreground">
          {{ product.name }}
        </h3>

        <!-- {/* Rating */} -->
        <Rating :rating="product.rating" />

        <!-- {/* Tags */} -->
        <Tags :product="product" />
      </div>
    </div>

    <!-- {/* Progress Bar */} -->
    <ProgressBar :product="product" />

    <!-- {/* Stats Grid */} -->
    <div class="mt-4 grid grid-cols-3 gap-2">
      <div class="rounded-lg bg-[oklch(0.92_0.06_200)] p-2.5">
        <div class="flex items-center gap-1 text-[oklch(0.5_0.08_200)]">
          <UIcon name="mage:calendar" class="size-4" />
          <span class="text-[10px] font-medium uppercase tracking-wide">Открыт</span>
        </div>
        <p
          v-if="product.opened_at"
          class="mt-1 text-xs font-semibold text-[oklch(0.4_0.08_200)]"
        >
          {{
            new Date(product.opened_at).toLocaleDateString("ru-RU", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          }}
        </p>
        <p v-else class="mt-1 text-xs font-semibold text-[oklch(0.4_0.08_200)]">
          Баночка еще не открыта
        </p>
      </div>

      <div class="rounded-lg bg-[oklch(0.9_0.08_165)] p-2.5">
        <div class="flex items-center gap-1 text-[oklch(0.45_0.1_165)]">
          <UIcon name="mage:shop" class="size-4" />
          <span class="text-[10px] font-medium uppercase tracking-wide"> Магазин </span>
        </div>
        <p class="mt-1 text-xs font-semibold text-[oklch(0.35_0.1_165)]">
          {{ product.shop }}
        </p>
      </div>

      <div class="rounded-lg bg-[oklch(0.9_0.08_340)] p-2.5">
        <div class="flex items-center gap-1 text-[oklch(0.5_0.1_340)]">
          <UIcon name="solar:ruble-broken" class="size-4" />
          <span class="text-[10px] font-medium uppercase tracking-wide">
            Цена за день
          </span>
        </div>
        <p
          v-if="typeof costPerDay === 'number'"
          class="mt-1 text-xs font-semibold text-[oklch(0.4_0.12_340)]"
        >
          {{ costPerDay.toFixed(2) }}
        </p>
        <p v-else class="mt-1 text-xs font-semibold text-[oklch(0.4_0.12_340)]">
          Начни банку, чтобы узнать
        </p>
      </div>
    </div>
  </div>
</template>
