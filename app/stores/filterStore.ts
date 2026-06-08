import { defineStore } from "pinia";

export const useFilterStore = defineStore("filter", {
  state: () => ({
    showFilter: false,
    searchQuery: "",
    filterBrand: [],
    filterCategory: [],
    filterShop: [],
    priceRange: [1, 100],
    isOpenProducts: false,
    isCloseProducts: false,
    isFinishedProducts: false,
    isTermLessThan30Days: false,
    isTermLessThan90Days: false,
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

    setIsCloseProducts(value: boolean) {
      this.isCloseProducts = value;
    },

    setIsOpenProducts(value: boolean) {
      this.isOpenProducts = value;
    },

    setIsFinishedProducts(value: boolean) {
      this.isFinishedProducts = value;
    },

    setIsTermLessThan90Days(value: boolean) {
      this.isTermLessThan90Days = value;
    },

    setIsTermLessThan30Days(value: boolean) {
      this.isTermLessThan30Days = value;
    },

    resetFilters() {
      this.searchQuery = "";
      this.filterCategory = [];
      this.filterBrand = [];
      this.filterShop = [];
      this.priceRange = this.initialValues.priceRange;
      this.isOpenProducts = false;
      this.isCloseProducts = false;
      this.isFinishedProducts = false;
      this.isTermLessThan30Days = false;
      this.isTermLessThan90Days = false;
    },
  },
});
