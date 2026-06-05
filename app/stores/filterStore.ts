import { defineStore } from "pinia";

export const useFilterStore = defineStore("filter", {
  state: () => ({
    showFilter: false,
    searchQuery: "",
    filterBrand: [],
    filterCategory: [],
    filterShop: [],
    filterMinPrice: 0,
    filterMaxPrice: Number.MAX_SAFE_INTEGER,
    dateRangeStart: null,
    dateRangeEnd: null,
    initialValues: null,
  }),

  actions: {
    setSearchQuery(query: string) {
      this.searchQuery = query;
    },

    setInitialValues(values: any) {
      this.initialValues = values;
    },

    setShowFilter(showFilter: boolean) {
      this.showFilter = showFilter;
    },

    setFilterMinPrice(price: number) {
      this.filterMinPrice = price;
    },

    setFilterMaxPrice(price: number) {
      this.filterMaxPrice = price;
    },

    resetFilters() {
      this.searchQuery = "";
      this.filterCategory = [];
      this.filterBrand = [];
      this.filterShop = [];
      this.filterMinPrice = 0;
      this.filterMaxPrice = Number.MAX_SAFE_INTEGER;
    },
  },
});
