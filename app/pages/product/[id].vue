<script setup lang="ts">
const { data } = await useFetch('/api/product');
const router = useRouter();
</script>

<template>
  <div class="m-8">
    <UIcon name="lets-icons:back-light" class="size-8" @click="router.back()" />
    <div class="text-highlighted text-lg/8">
      {{ data?.brand }} - {{ data?.productName }}
    </div>
    <div class="flex flex-col divide-y">
      <ProductRow field="Оценка" :value="data?.rating" />
      <ProductRow field="Комментарий" :value="data?.comment" />
      <ProductRow field="Тип продукта" :value="data?.productType" />
      <ProductRow field="Срок годности" :value="data?.expiryDate" />
      <ProductRow field="Состав" :value="data?.ingredients" />
      <ProductRow field="Объем" :value="data?.volume" />
      <ProductRow field="Рыночная стоимость" :value="data?.marketPrice?.value" />
      <ProductRow field="Стоимость покупки" :value="data?.actualPrice?.value" />
      <ProductRow field="Магазин покупки" :value="data?.shop" />
      <ProductRow field="Дата начала использования" :value="data?.startDate" />
      <ProductRow field="Дата окончания использования" :value="data?.endDate" />
      <ProductRow field="Год покупки" :value="data?.purchaseYear" />
    </div>
  </div>
</template>