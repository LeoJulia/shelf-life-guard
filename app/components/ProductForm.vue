<script setup lang="ts">
import { useProductStore, useProductRPC } from "~/stores/productStore";
import { parseDate, type DateValue } from "@internationalized/date";
import type { TProduct } from "~/types/product.types";

const productStore = useProductStore();
const productRPC = useProductRPC();

const props = defineProps<{ product?: TProduct }>();

const { product } = storeToRefs(productStore);
const brands = computed(() => productRPC.brands);
const categories = computed(() => productRPC.categories);
const shops = computed(() => productRPC.shops);
const volumes = computed(() => productRPC.volumes);

const expiryDate = shallowRef<DateValue | null>(null);
const openedAt = shallowRef<DateValue | null>(null);
const finishedAt = shallowRef<DateValue | null>(null);

const dateFields = [
  ["expiryDate", expiryDate, "expiry_date"],
  ["openedAt", openedAt, "opened_at"],
  ["finishedAt", finishedAt, "finished_at"],
] as const;

watch(
  () => props.product,
  (newProduct) => {
    if (newProduct) productStore.setProduct(newProduct);
  },
  { immediate: true }
);

watch(
  () => productStore.product,
  (newProduct) => {
    if (!newProduct) return;

    for (const [refName, dateRef, fieldName] of dateFields) {
      const dateValue = newProduct[fieldName] ? parseDate(newProduct[fieldName]) : null;
      if (dateRef.value !== dateValue) dateRef.value = dateValue;
    }
  },
  { immediate: true }
);

watch(expiryDate, (newDate) => {
  if (product.value) product.value.expiry_date = newDate ? newDate.toString() : null;
});

watch(openedAt, (newDate) => {
  if (product.value) product.value.opened_at = newDate ? newDate.toString() : null;
});

watch(finishedAt, (newDate) => {
  if (product.value) product.value.finished_at = newDate ? newDate.toString() : null;
});

onMounted(async () => {
  await productRPC.fetchAllOptions();
});

const onSave = async (close?: () => void) => {
  if (!product.value) return;

  await $fetch(`/api/products/${product.value.id}`, {
    method: "PUT",
    body: product.value,
  });

  close?.();
};

const onCreateItem = (list: string[], item: string, field: keyof Pick<TProduct, "brand" | "category" | "volume" | "shop">) => {
  list.push(item);
  if (product.value) product.value[field] = item as never;
};

const onCreateBrand = (item: string) => onCreateItem(brands.value, item, "brand");
const onCreateCategory = (item: string) => onCreateItem(categories.value, item, "category");
const onCreateVolume = (item: string) => onCreateItem(volumes.value, item, "volume");
const onCreateShop = (item: string) => onCreateItem(shops.value, item, "shop");
</script>

<template>
  <UModal title="Редактирование баночки" :ui="{ footer: 'justify-end' }">
    <UButton color="neutral" variant="ghost">
      <UIcon name="mage:edit" class="size-8" />
    </UButton>

    <template #body>
      <div v-if="product?.name || brands.length > 0">
        <UForm :state="product" @submit.prevent="">
          <UFormField
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Название"
            required
            :ui="{ container: 'w-full', wrapper: 'w-40' }"
          >
            <UInput class="w-full" v-model="product.name" type="text" placeholder="Название продукта" />
          </UFormField>

          <UFormField
            required
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Бренд"
            :ui="{ container: 'w-full', wrapper: 'w-40' }"
          >
            <USelectMenu
              class="w-full"
              v-model="product.brand"
              filter
              create-item
              :items="brands"
              placeholder="Выберите бренд"
              clear
              :content="{ align: 'start', side: 'right', sideOffset: 8 }"
              @create="onCreateBrand"
            />
          </UFormField>

          <UFormField
            required
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Категория"
            :ui="{ container: 'w-full', wrapper: 'w-40' }"
          >
            <USelectMenu
              class="w-full"
              v-model="product.category"
              filter
              create-item
              :items="categories"
              placeholder="Выберите категорию"
              clear
              :content="{ align: 'start', side: 'right', sideOffset: 8 }"
              @create="onCreateCategory"
            />
          </UFormField>

          <UFormField
            required
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Объём"
            :ui="{ container: 'w-full', wrapper: 'w-40' }"
          >
            <USelectMenu
              class="w-full"
              v-model="product.volume"
              filter
              create-item
              :items="volumes"
              placeholder="Выберите объём"
              clear
              :content="{ align: 'start', side: 'right', sideOffset: 8 }"
              @create="onCreateVolume"
            />
          </UFormField>

          <UFormField
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Рейтинг"
            :ui="{ container: 'w-full', wrapper: 'w-40' }"
          >
            <UInputNumber class="w-full" v-model="product.rating" :max="5" />
          </UFormField>

          <UFormField
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Рыночная цена"
            :ui="{ container: 'w-full', wrapper: 'w-40' }"
          >
            <UInputNumber
              class="w-full"
              v-model="product.market_price"
              orientation="vertical"
              locale="ru-RU"
              :min="0"
              :format-options="{
                style: 'currency',
                currency: 'RUB',
                currencyDisplay: 'symbol',
                currencySign: 'accounting',
              }"
            />
          </UFormField>

          <UFormField
            required
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Цена покупки"
            :ui="{ container: 'w-full', wrapper: 'w-40' }"
          >
            <UInputNumber
              class="w-full"
              v-model="product.actual_price"
              orientation="vertical"
              locale="ru-RU"
              :min="0"
              :format-options="{
                style: 'currency',
                currency: 'RUB',
                currencyDisplay: 'symbol',
                currencySign: 'accounting',
              }"
            />
          </UFormField>

          <UFormField
            required
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Магазин"
            :ui="{ container: 'w-full', wrapper: 'w-40' }"
          >
            <USelectMenu
              class="w-full"
              v-model="product.shop"
              filter
              create-item
              :items="shops"
              placeholder="Выберите магазин"
              clear
              :content="{ align: 'start', side: 'right', sideOffset: 8 }"
              @create="onCreateShop"
            />
          </UFormField>

          <UFormField
            required
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Год покупки"
            :ui="{ container: 'w-full', wrapper: 'w-40' }"
          >
            <UInput
              v-model="product.year"
              type="number"
              :min="1900"
              :max="new Date().getFullYear() + 1"
            />
          </UFormField>

          <UFormField
            required
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Срок годности"
            help="Ввод с клавиатуры"
            :ui="{ container: 'w-full', wrapper: 'w-40', help: 'text-muted-foreground' }"
          >
            <UInputDate v-model="expiryDate" locale="ru" />
          </UFormField>

          <UFormField
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Дата открытия"
            help="Ввод с клавиатуры"
            :ui="{ container: 'w-full', wrapper: 'w-40', help: 'text-muted-foreground' }"
          >
            <UInputDate v-model="openedAt" locale="ru" />
          </UFormField>

          <UFormField
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Дата окончания"
            help="Ввод с клавиатуры"
            :ui="{ container: 'w-full', wrapper: 'w-40', help: 'text-muted-foreground' }"
          >
            <UInputDate v-model="finishedAt" locale="ru" />
          </UFormField>

          <UFormField
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Состав"
            :ui="{ container: 'w-full', wrapper: 'w-40' }"
          >
            <UTextarea class="w-full" v-model="product.ingredients" placeholder="ароматизатор, вода..." />
          </UFormField>

          <UFormField
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Заметки"
            :ui="{ container: 'w-full', wrapper: 'w-40' }"
          >
            <UTextarea class="w-full" v-model="product.notes" placeholder="Дополнительные заметки" />
          </UFormField>
        </UForm>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton label="Отменить" variant="outline" @click="close" />
      <UButton label="Сохранить" type="submit" @click="onSave(close)" />
    </template>
  </UModal>
</template>
