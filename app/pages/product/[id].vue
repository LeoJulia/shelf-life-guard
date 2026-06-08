<script setup lang="ts">
import type { TProduct } from '~/types/product.types';
import Rating from '~/components/ui/Rating.vue';
import ProgressBar from '~/components/ui/ProgressBar.vue';
import Tags from '~/components/ui/Tags.vue';

const router = useRouter();
const route = useRoute();

const { data: product } = await useFetch<TProduct>('/api/product', {
  query: { id: route.params.id },
});
</script>

<template>
  <main class="mx-auto max-w-7xl px-6 py-8">
    <div class="flex items-center mb-6" @click="router.back()">
      <UIcon name="mage:arrow-left-square" class="size-8" />
      Назад
    </div>
    <!-- TODO: Шапку, рейтинг, теги и прогресс бар переиспользовать ProductCard -->
    <div
      class="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <div class="mb-6">
        <span class="text-s font-medium uppercase tracking-wider text-muted-foreground">
          {{ product.brand }}
        </span>
        <h2 class="mt-0.5 text-base font-semibold leading-tight text-foreground">
          {{ product.name }}
        </h2>
      </div>

      <Rating :rating="product.rating" />
      <Tags :product="product" />
      <ProgressBar :product="product" />

      <div class="flex flex-col divide-y mt-4">
        <ProductRow field="Комментарий" :value="product?.notes" />
        <!-- TODO: скопировать состав для анализа в ИИ -->
        <ProductRow field="Состав" :value="product?.ingredients" />
        <ProductRow field="Рыночная стоимость" :value="product?.market_price" />
        <ProductRow field="Стоимость покупки" :value="product?.actual_price" />
        <ProductRow field="Магазин покупки" :value="product?.shop" />
        <ProductRow field="Дата начала использования" :value="new Date(product.opened_at).toLocaleDateString('ru-RU', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })" />
        <ProductRow v-if="product.finished_at" field="Дата окончания использования" :value="new Date(product.finished_at).toLocaleDateString('ru-RU', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })" />
      </div>
    </div>
  </main>
</template>
