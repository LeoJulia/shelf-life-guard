<script setup lang="ts">
import type { TProduct } from '~/types/product.types';

const router = useRouter();
const route = useRoute();

const { data } = await useFetch<TProduct>('/api/product', {
  query: { id: route.params.id },
});
</script>

<template>
  <div class="m-8">
    <UIcon name="lets-icons:back-light" class="size-8" @click="router.back()" />
    <div class="text-highlighted text-lg/8">
      {{ data?.brand }} - {{ data?.name }}
    </div>
    <div class="flex flex-col divide-y">
      <ProductRow field="Оценка" :value="data?.rating" />
      <ProductRow field="Комментарий" :value="data?.notes" />
      <ProductRow field="Тип продукта" :value="data?.category" />
      <ProductRow field="Срок годности" :value="data?.expiry_date" />
      <ProductRow field="Состав" :value="data?.ingredients" />
      <ProductRow field="Объем" :value="data?.volume" />
      <ProductRow field="Рыночная стоимость" :value="data?.market_price" />
      <ProductRow field="Стоимость покупки" :value="data?.actual_price" />
      <ProductRow field="Магазин покупки" :value="data?.shop" />
      <ProductRow field="Дата начала использования" :value="data?.opened_at" />
      <ProductRow field="Дата окончания использования" :value="data?.finished_at" />
      <ProductRow field="Год покупки" :value="data?.year" />
    </div>
  </div>
</template>
