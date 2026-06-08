<script setup lang="ts">
import { useFilterStore } from '~/stores/filterStore';

const filterStore = useFilterStore();
const {
  showFilter,
  filterBrand,
  filterCategory,
  filterShop,
  priceRange,
  initialValues,
} = storeToRefs(filterStore);

const { data } = await useFetch<{}>('/api/filter');
filterStore.setInitialValues(data.value);

</script>

<template>
  <USidebar v-model:open="showFilter" side="right" close title="Фильтры" :ui="{
    container: 'bg-sidebar text-sidebar-foreground border-border',
    header: 'py-5 border-border',
    close: 'hover:bg-sidebar-primary-foreground active:bg-sidebar-primary active:text-sidebar-primary-foreground',
  }">
    <div>
      <span>Бренд: </span>
      <USelectMenu :items="initialValues?.brands" :searchInput="{ placeholder: 'Поиск...' }" multiple filter clear
        class="w-full" v-model="filterBrand" :ui="{
          base: 'rounded-sm',
        }" />
    </div>
    <div>
      <span>Тип продукта: </span>
      <USelectMenu :items="initialValues?.categories" :searchInput="{ placeholder: 'Поиск...' }" multiple filter clear
        class="w-full" v-model="filterCategory" :ui="{
          base: 'rounded-sm',
        }" />
    </div>
    <div>
      <span>Магазин: </span>
      <USelectMenu :items="initialValues?.shops" :searchInput="{ placeholder: 'Поиск...' }" multiple filter clear
        class="w-full" v-model="filterShop" :ui="{
          base: 'rounded-sm',
        }" />
    </div>
    <div>
      <span>Стоимость покупки: </span>
      <div class="flex justify-between mb-2">
        <span>{{ priceRange[0] }}</span>
        <span>{{ priceRange[1] }}</span>
      </div>
      <USlider v-model="priceRange" :min="initialValues.priceRange[0]" :max="initialValues.priceRange[1]" :ui="{
        track: 'bg-secondary/50'
      }" />
    </div>
  </USidebar>
</template>