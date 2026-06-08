import { defineStore } from "pinia";

export const useFilterStore = defineStore("filter", {
  state: () => ({
    showFilter: false,
    searchQuery: "",
    filterBrand: [],
    filterCategory: [],
    filterShop: [],
    priceRange: [1, 100],
    dateRangeStart: 0,
    dateRangeEnd: null,
    isOpenProducts: false,
    initialValues: {
      brands: [],
      categories: [],
      shops: [],
      priceRange: [1, 5000],
    },
  }),

  actions: {
    setSearchQuery(query: string) {
      this.searchQuery = query;
    },

    setInitialValues(values: any) {
      this.initialValues = values;
      this.priceRange = values.priceRange;
    },

    setShowFilter(showFilter: boolean) {
      this.showFilter = showFilter;
    },

    resetFilters() {
      this.searchQuery = "";
      this.filterCategory = [];
      this.filterBrand = [];
      this.filterShop = [];
      this.priceRange = this.initialValues.priceRange;
    },
  },
});
