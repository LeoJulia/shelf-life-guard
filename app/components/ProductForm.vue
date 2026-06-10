<script setup lang="ts">
import { useProductStore, useProductRPC } from "~/stores/productStore";
import { parseDate } from "@internationalized/date";

const productStore = useProductStore();
const productRPC = useProductRPC();

const { product } = storeToRefs(productStore);
const brands = computed(() => productRPC.brands);
const categories = computed(() => productRPC.categories);
const shops = computed(() => productRPC.shops);
const volumes = computed(() => productRPC.volumes);

// Даты - используем shallowRef для оптимизации реактивности
const expiryDate = shallowRef(parseDate("2025-12-31"));
const openedAt = shallowRef(parseDate("2025-12-31"));
const finishedAt = shallowRef(parseDate("2025-12-31"));

// Цены
const marketPrice = ref<number | null>(null);

const actualPrice = ref<number | null>(null);

// Год покупки
const yearValue = ref(new Date().getFullYear());

// Watch для обновления всех полей при изменении productStore
watch(
  () => product.value,
  (newProduct) => {
    if (!newProduct) return;

    // Обновляем основные поля
    marketPrice.value = newProduct.market_price ?? null;
    actualPrice.value = newProduct.actual_price ?? null;
    yearValue.value = newProduct.year ?? new Date().getFullYear();

    // Обновляем даты
    if (newProduct.expiry_date) expiryDate.value = parseDate(newProduct.expiry_date);
    if (newProduct.opened_at) openedAt.value = parseDate(newProduct.opened_at);
    if (newProduct.finished_at) finishedAt.value = parseDate(newProduct.finished_at);
  },
  { immediate: true }
);

// Watch для обновления дат при изменении productStore
watch(
  () => product.value?.expiry_date,
  (newDateStr) => {
    if (!newDateStr) return;
    expiryDate.value = parseDate(newDateStr);
  }
);

watch(
  () => product.value?.opened_at,
  (newDateStr) => {
    if (!newDateStr) return;
    openedAt.value = parseDate(newDateStr);
  }
);

watch(
  () => product.value?.finished_at,
  (newDateStr) => {
    if (!newDateStr) return;
    finishedAt.value = parseDate(newDateStr);
  }
);

// Watch для синхронизации цен в product
watch(marketPrice, (newPrice) => {
  if (product.value) product.value.market_price = newPrice;
});

watch(actualPrice, (newPrice) => {
  if (product.value) product.value.actual_price = newPrice;
});

// Watch для синхронизации дат в product (преобразуем DateValue в строку)
watch(expiryDate, (newDate) => {
  if (product.value && newDate) {
    product.value.expiry_date = newDate.toString();
  }
});

watch(openedAt, (newDate) => {
  if (product.value && newDate) {
    product.value.opened_at = newDate.toString();
  }
});

watch(finishedAt, (newDate) => {
  if (product.value && newDate) {
    product.value.finished_at = newDate.toString();
  }
});

// Watch для синхронизации года
watch(yearValue, (newYear) => {
  if (product.value) product.value.year = newYear;
});

// Watch для обновления основных полей при изменении productStore
watch(
  () => product.value?.name,
  (newName) => {
    if (!product.value || newName === undefined) return;
    product.value.name = newName;
  }
);

watch(
  () => product.value?.brand,
  (newBrand) => {
    if (!product.value || newBrand === undefined) return;
    product.value.brand = newBrand;
  }
);

watch(
  () => product.value?.category,
  (newCategory) => {
    if (!product.value || newCategory === undefined) return;
    product.value.category = newCategory;
  }
);

watch(
  () => product.value?.volume,
  (newVolume) => {
    if (!product.value || newVolume === undefined) return;
    product.value.volume = newVolume;
  }
);

watch(
  () => product.value?.shop,
  (newShop) => {
    if (!product.value || newShop === undefined) return;
    product.value.shop = newShop;
  }
);

watch(
  () => product.value?.market_price,
  (newPrice) => {
    marketPrice.value = newPrice ?? null;
  }
);

watch(
  () => product.value?.actual_price,
  (newPrice) => {
    actualPrice.value = newPrice ?? null;
  }
);

watch(
  () => product.value?.year,
  (newYear) => {
    yearValue.value = newYear ?? new Date().getFullYear();
  }
);

// Загрузка опций при монтировании компонента
onMounted(async () => {
  await productRPC.fetchAllOptions();
});

// Сохранение в консоль
const onSave = async () => {
  if (!product.value) return;
  console.log("=== Обновлённые данные продукта ===");
  console.log(product.value);

  await $fetch(`/api/products/${product.value.id}`, {
    method: "PUT",
    body: product.value,
  });
};

const onCreateBrand = (item: string) => {
  brands.value.push(item);

  product.value.brand = item;
};

const onCreateCategory = (item: string) => {
  categories.value.push(item);

  product.value.category = item;
};

const onCreateVolume = (item: string) => {
  volumes.value.push(item);

  product.value.volume = item;
};

const onCreateShop = (item: string) => {
  shops.value.push(item);

  product.value.shop = item;
};
</script>

<template>
  <UModal title="Редактирование баночки" :ui="{ footer: 'justify-end' }">
    <UButton color="neutral" variant="ghost">
      <UIcon name="mage:edit" class="size-8" />
    </UButton>

    <template #body>
      <!-- Форма отображается только если product.value существует -->
      <div v-if="product?.name || brands.length > 0">
        <UForm :state="product" @submit.prevent="">
          <!-- Рейтинг -->
          <UFormField
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Рейтинг"
            :ui="{
              container: 'w-full',
              wrapper: 'w-40',
            }"
          >
            <UInputNumber class="w-full" v-model="product.rating" :max="5" />
          </UFormField>

          <!-- Основная информация -->
          <UFormField
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Название"
            required
            :ui="{
              container: 'w-full',
              wrapper: 'w-40',
            }"
          >
            <UInput
              class="w-full"
              v-model="product.name"
              type="text"
              placeholder="Название продукта"
            />
          </UFormField>

          <UFormField
            required
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Бренд"
            :ui="{
              container: 'w-full',
              wrapper: 'w-40',
            }"
          >
            <USelectMenu
              class="w-full"
              v-model="product.brand"
              filter
              create-item
              :items="brands"
              placeholder="Выберите бренд"
              clear
              :content="{
                align: 'start',
                side: 'right',
                sideOffset: 8,
              }"
              @create="onCreateBrand"
            />
          </UFormField>

          <UFormField
            required
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Категория"
            :ui="{
              container: 'w-full',
              wrapper: 'w-40',
            }"
          >
            <USelectMenu
              class="w-full"
              v-model="product.category"
              filter
              create-item
              :items="categories"
              placeholder="Выберите категорию"
              clear
              :content="{
                align: 'start',
                side: 'right',
                sideOffset: 8,
              }"
              @create="onCreateCategory"
            />
          </UFormField>

          <UFormField
            required
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Объём"
            :ui="{
              container: 'w-full',
              wrapper: 'w-40',
            }"
          >
            <USelectMenu
              class="w-full"
              v-model="product.volume"
              filter
              create-item
              :items="volumes"
              placeholder="Выберите объём"
              clear
              :content="{
                align: 'start',
                side: 'right',
                sideOffset: 8,
              }"
              @create="onCreateVolume"
            />
          </UFormField>

          <!-- Цены -->
          <UFormField
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Рыночная цена"
            :ui="{
              container: 'w-full',
              wrapper: 'w-40',
            }"
          >
            <UInputNumber
              class="w-full"
              v-model="marketPrice"
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
            :ui="{
              container: 'w-full',
              wrapper: 'w-40',
            }"
          >
            <UInputNumber
              class="w-full"
              v-model="actualPrice"
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

          <!-- Магазин и год -->
          <UFormField
            required
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Магазин"
            :ui="{
              container: 'w-full',
              wrapper: 'w-40',
            }"
          >
            <USelectMenu
              class="w-full"
              v-model="product.shop"
              filter
              create-item
              :items="shops"
              placeholder="Выберите магазин"
              clear
              :content="{
                align: 'start',
                side: 'right',
                sideOffset: 8,
              }"
              @create="onCreateShop"
            />
          </UFormField>

          <UFormField
            required
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Год покупки"
            :ui="{
              container: 'w-full',
              wrapper: 'w-40',
            }"
          >
            <UInput
              v-model="yearValue"
              type="number"
              :min="1900"
              :max="new Date().getFullYear() + 1"
            />
          </UFormField>

          <!-- Даты -->
          <UFormField
            required
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Срок годности"
            help="Ввод с клавиатуры"
            :ui="{
              container: 'w-full',
              wrapper: 'w-40',
              help: 'text-muted-foreground',
            }"
          >
            <UInputDate v-model="expiryDate" locale="ru" />
          </UFormField>

          <UFormField
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Дата открытия"
            help="Ввод с клавиатуры"
            :ui="{
              container: 'w-full',
              wrapper: 'w-40',
              help: 'text-muted-foreground',
            }"
          >
            <UInputDate v-model="openedAt" locale="ru" />
          </UFormField>

          <UFormField
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Дата окончания"
            help="Ввод с клавиатуры"
            :ui="{
              container: 'w-full',
              wrapper: 'w-40',
              help: 'text-muted-foreground',
            }"
          >
            <UInputDate v-model="finishedAt" locale="ru" />
          </UFormField>

          <!-- Текстовые поля -->
          <UFormField
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Состав"
            :ui="{
              container: 'w-full',
              wrapper: 'w-40',
            }"
          >
            <UTextarea
              class="w-full"
              v-model="product.ingredients"
              placeholder="ароматизатор, вода..."
            />
          </UFormField>

          <UFormField
            class="justify-start w-full mb-2"
            orientation="horizontal"
            label="Заметки"
            :ui="{
              container: 'w-full',
              wrapper: 'w-40',
            }"
          >
            <UTextarea
              class="w-full"
              v-model="product.notes"
              placeholder="Дополнительные заметки"
            />
          </UFormField>
        </UForm>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton label="Отменить" variant="outline" @click="close" />
      <UButton label="Сохранить" type="submit" @click="onSave" />
    </template>
  </UModal>
</template>
