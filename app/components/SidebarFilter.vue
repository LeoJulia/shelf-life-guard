<script setup lang="ts">
import { useFilterStore } from '~/stores/filterStore';

const filterStore = useFilterStore();
const {
  showFilter,
  filterBrand,
  filterCategory,
  filterShop,
  priceRange,
  isOpenProducts,
  isCloseProducts,
  isFinishedProducts,
  isTermLessThan30Days,
  isTermLessThan90Days,
  initialValues,
} = storeToRefs(filterStore);

const { data } = await useFetch<{}>('/api/filter');
filterStore.setInitialValues(data.value);

const updateCloseToggle = () => {
  if (isOpenProducts.value || isFinishedProducts.value) {
    filterStore.setIsCloseProducts(false);
  }
};

const updateOpenAndFinishedToggle = () => {
  if (isCloseProducts.value) {
    filterStore.setIsOpenProducts(false);
    filterStore.setIsFinishedProducts(false);
  }
};

const update90TermToggle = () => {
  if (isTermLessThan30Days.value) {
    filterStore.setIsTermLessThan90Days(false);
  }
};

const update30TermToggle = () => {
  if (isTermLessThan90Days.value) {
    filterStore.setIsTermLessThan30Days(false);
  }
};

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
      <USlider v-model="priceRange" :min="initialValues.priceRange[0]" :max="initialValues.priceRange[1]" />
    </div>

    <div class="mb-1">
      <USwitch v-model="isOpenProducts" @change="updateCloseToggle" label="Открытые баночки" />
    </div>

    <div class="mb-2">
      <USwitch v-model="isCloseProducts" @change="updateOpenAndFinishedToggle" label="Закрытые баночки" />
    </div>

    <div class="mb-2">
      <USwitch v-model="isFinishedProducts" @change="updateCloseToggle" label="Законченные баночки" />
    </div>

    <div class="mb-2">
      <USwitch v-model="isTermLessThan30Days" @change="update90TermToggle" label="Срок меньше 30 дней" />
    </div>

    <div class="mb-2">
      <USwitch v-model="isTermLessThan90Days" @change="update30TermToggle" label="Срок меньше 90 дней" />
    </div>
  </USidebar>
</template>