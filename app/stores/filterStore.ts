import { defineStore } from "pinia";

export const useFilterStore = defineStore("filter", {
  state: () => ({
    searchQuery: "",
    filterCategory: "all",
    filterMinPrice: 0,
    filterMaxPrice: Number.MAX_SAFE_INTEGER,
  }),

  getters: {
    getSearchQuery: (state) => state.searchQuery,
  },

  actions: {
    setSearchQuery(query: string) {
      this.searchQuery = query;
    },

    setFilterCategory(category: string) {
      this.filterCategory = category;
    },

    setFilterMinPrice(price: number) {
      this.filterMinPrice = price;
    },

    setFilterMaxPrice(price: number) {
      this.filterMaxPrice = price;
    },

    resetFilters() {
      this.searchQuery = "";
      this.filterCategory = "all";
      this.filterMinPrice = 0;
      this.filterMaxPrice = Number.MAX_SAFE_INTEGER;
    },
  },
});
