<script setup lang="ts">
import type { RadioGroupItem } from "@nuxt/ui";
import { useFilterStore } from "~/stores/filterStore";

const filterStore = useFilterStore();

const priceItems = ref<RadioGroupItem[]>([
  { label: "Сначала дешевле", value: "actual_price_asc" },
  { label: "Сначала дороже", value: "actual_price_desc" },
]);
const createdDateItems = ref<RadioGroupItem[]>([
  { label: "Сначала новые", value: "created_at_desc" },
  { label: "Сначала старые", value: "created_at_asc" },
]);
const expiryDateItems = ref<RadioGroupItem[]>([
  { label: "Скоро истечет", value: "expiry_date_asc" },
  { label: "Нескоро истечет", value: "expiry_date_desc" },
]);
const openedDateItems = ref<RadioGroupItem[]>([
  { label: "Открыты последними", value: "opened_at_desc" },
  { label: "Открыты первыми", value: "opened_at_asc" },
]);
const finishedDateItems = ref<RadioGroupItem[]>([
  { label: "Закончились последними", value: "finished_at_desc" },
  { label: "Закончились первыми", value: "finished_at_asc" },
]);

const value = ref();

watch(value, (newValue) => {
  filterStore.setSort(newValue);
});
</script>

<template>
  <UPopover mode="hover" arrow :close-delay="300">
    <UButton
      variant="outline"
      size="sm"
      class="rounded-sm gap-2 text-foreground border-0.5 border-border"
    >
      <UIcon name="mage:filter" class="size-5" />
      Сортировка
    </UButton>

    <template #content>
      <div class="inline-flex flex-col m-4">
        <div class="mb-2">
          <span>Цена покупки:</span>
          <URadioGroup v-model="value" :items="priceItems" />
        </div>

        <div class="mb-2">
          <span>Дата добавления:</span>
          <URadioGroup v-model="value" :items="createdDateItems" />
        </div>

        <div class="mb-2">
          <span>Срок годности:</span>
          <URadioGroup v-model="value" :items="expiryDateItems" />
        </div>

        <div class="mb-2">
          <span>Дата открытия:</span>
          <URadioGroup v-model="value" :items="openedDateItems" />
        </div>

        <div class="mb-2">
          <span>Дата окончания:</span>
          <URadioGroup v-model="value" :items="finishedDateItems" />
        </div>

        <div>
          <UButton label="Очистить" @click="filterStore.resetFilters" />
        </div>
      </div>
    </template>
  </UPopover>
</template>
