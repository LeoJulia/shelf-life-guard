<script setup>
const { product } = defineProps(["product"]);

const progress = product.expiry_date ? Math.round(Math.max(
  0,
  Math.min(
    100,
    ((new Date(product.expiry_date).getTime() - new Date().getTime()) / (90 * 8.64e+7)) * 100
  ))) : 0;

const lastDate = product.finished_at ? new Date(product.finished_at) : new Date();
const costPerDay = product.actual_price / ((lastDate.getTime() - new Date(product.opened_at).getTime()) / 8.64e+7);
</script>

<template>
  <div
    class="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
    <div class="flex gap-4">
      <!-- {/* Product Image */} -->
      <div class="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-input">
        <img src="" :alt="product.name" fill
          class="object-cover transition-transform duration-300 group-hover:scale-105" />
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
        <div class="mt-1.5 flex items-center gap-1">
          <div v-for="i in 5">
            <UIcon v-if="i < product.rating" name="mage:star-fill" class="size-5 fill-primary text-primary" />
            <UIcon v-else name="mage:star-fill" class="size-5 fill-muted text-muted" />
          </div>
        </div>

        <!-- {/* Tags */} -->
        <div class="mt-2 flex flex-wrap gap-1.5">
          <span
            class="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[oklch(0.9_0.08_340)] text-[oklch(0.45_0.1_340)]">{{
              product?.category }}</span>
          <span
            class="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[oklch(0.9_0.08_200)] text-[oklch(0.45_0.1_200)]">{{
              product?.volume }}</span>
          <span
            class="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[oklch(0.9_0.08_165)] text-[oklch(0.4_0.1_165)]">{{
              product?.year }}</span>
          <span
            class="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[oklch(0.92_0.08_80)] text-[oklch(0.45_0.12_80)]">{placeholder}</span>
          <span
            class="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[oklch(0.9_0.08_280)] text-[oklch(0.45_0.1_280)]">{placeholder}</span>
        </div>
      </div>
    </div>

    <!-- {/* Progress Bar */} -->
    <div class="mt-4" v-if="product.expiry_date && !product.finished_at">
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

    <!-- {/* Stats Grid */} -->
    <div class="mt-4 grid grid-cols-3 gap-2">
      <div class="rounded-lg bg-[oklch(0.92_0.06_200)] p-2.5">
        <div class="flex items-center gap-1 text-[oklch(0.5_0.08_200)]">
          <UIcon name="mage:calendar" class="size-4" />
          <span class="text-[10px] font-medium uppercase tracking-wide">Открыт</span>
        </div>
        <p v-if="product.opened_at" class="mt-1 text-xs font-semibold text-[oklch(0.4_0.08_200)]">
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
          <span class="text-[10px] font-medium uppercase tracking-wide">
            Магазин
          </span>
        </div>
        <p class="mt-1 text-xs font-semibold text-[oklch(0.35_0.1_165)]">
          {{ product?.shop }}
        </p>
      </div>

      <div class="rounded-lg bg-[oklch(0.9_0.08_340)] p-2.5">
        <div class="flex items-center gap-1 text-[oklch(0.5_0.1_340)]">
          <UIcon name="solar:ruble-broken" class="size-4" />
          <span class="text-[10px] font-medium uppercase tracking-wide">
            Стоимость за день
          </span>
        </div>
        <p v-if="product.opened_at" class="mt-1 text-xs font-semibold text-[oklch(0.4_0.12_340)]">
          {{ costPerDay.toFixed(2) }}
        </p>
        <p v-else class="mt-1 text-xs font-semibold text-[oklch(0.4_0.12_340)]">
          Начни банку, чтобы узнать
        </p>
      </div>
    </div>
  </div>
</template>