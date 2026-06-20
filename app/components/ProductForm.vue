<script setup lang="ts">
import EditFormField from './ui/EditFormField.vue';
import { useProductStore, useProductRPC } from "~/stores/productStore";
import { parseDate, type DateValue } from "@internationalized/date";
import type { TProduct } from "~/types/product.types";

const supabase = useSupabaseClient()
const user = useSupabaseUser()

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
const image = ref<File>();

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

const uploadImage = async () => {
  if (!image.value || !user.value) return;

  const ext = image.value.name.split(".").pop();

  const fileName = `${crypto.randomUUID()}.${ext}`;

  const path = `${user.value.sub}/${fileName}`;

  const compressedFile = await compressImage(image.value);

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, compressedFile);

  if (error) {
    throw error;
  }

  return path;
}

const onSave = async (close?: () => void) => {
  if (!product.value) return;

  const imgPath = await uploadImage();

  const {imageUrl, ...productWithoutUrl} = product.value;
  const body = {
    ...productWithoutUrl,
    image_path: imgPath ?? product.value.image_path,
  };

  if (product.value.id) {
    await $fetch(`/api/products/${product.value.id}`, {
      method: "PUT",
      body,
    });
  } else {
    await $fetch(`/api/products/products`, {
      method: "POST",
      body: {...body, id: undefined},
    });
  }

  await refreshNuxtData();
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
    <slot />

    <template #body>
      <div v-if="product?.name || brands.length > 0">
        <UForm :state="product" @submit.prevent="">
          <EditFormField label="Фотография">
            <UFileUpload
              class="w-full"
              v-model="image"
              accept="image/*"
              description="SVG, PNG, JPG or GIF (max. 2MB)"
              label="Как выглядит твоя баночка"
              icon="mage:image-upload"
              :ui="{ description: 'text-muted-foreground' }"
            />
          </EditFormField>

          <EditFormField label="Название">
            <UInput
              class="w-full"
              v-model="product.name"
              type="text"
              placeholder="Название продукта"
            />
          </EditFormField>

          <EditFormField label="Бренд" required>
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
          </EditFormField>

          <EditFormField label="Категория">
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
          </EditFormField>

          <EditFormField label="Объём" required>
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
          </EditFormField>

          <EditFormField label="Рейтинг">
            <UInputNumber class="w-full" v-model="product.rating" :max="5" />
          </EditFormField>

          <EditFormField label="Рыночная цена">
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
          </EditFormField>

          <EditFormField label="Цена покупки" required>
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
          </EditFormField>

          <EditFormField label="Магазин" required>
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
          </EditFormField>

          <EditFormField label="Год покупки" required>
            <UInput
              v-model="product.year"
              type="number"
              :min="1900"
              :max="new Date().getFullYear() + 1"
            />
          </EditFormField>

          <EditFormField label="Срок годности" help="Ввод с клавиатуры">
            <UInputDate v-model="expiryDate" locale="ru" />
          </EditFormField>

          <EditFormField label="Дата открытия" help="Ввод с клавиатуры">
            <UInputDate v-model="openedAt" locale="ru" />
          </EditFormField>

          <EditFormField label="Дата окончания" help="Ввод с клавиатуры">
            <UInputDate v-model="finishedAt" locale="ru" />
          </EditFormField>

          <EditFormField label="Состав">
            <UTextarea
              class="w-full"
              v-model="product.ingredients"
              placeholder="ароматизатор, вода..."
            />
          </EditFormField>

          <EditFormField label="Заметки">
            <UTextarea
              class="w-full"
              v-model="product.notes"
              placeholder="Дополнительные заметки"
            />
          </EditFormField>
        </UForm>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton label="Отменить" variant="outline" @click="close" />
      <UButton label="Сохранить" type="submit" @click="onSave(close)" />
    </template>
  </UModal>
</template>
