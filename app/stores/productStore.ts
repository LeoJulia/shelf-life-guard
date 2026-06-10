import { defineStore } from "pinia";
import type { TProduct } from "~/types/product.types";

export const useProductStore = defineStore("product", {
  state: () => ({
    product: {
      id: "",
      name: "",
      brand: null as string | null,
      category: null as string | null,
      volume: null as string | null,
      market_price: null as number | null,
      actual_price: null as number | null,
      shop: null as string | null,
      year: null as number | null,
      opened_at: null as string | null,
      expiry_date: null as string | null,
      created_at: null as string | null,
      finished_at: null as string | null,
      rating: null as number | null,
      ingredients: null as string | null,
      notes: null as string | null,
    },
  }),

  getters: {
    productRef: () => this.product,
  },

  actions: {
    setProduct(product: TProduct) {
      this.product = { ...this.product, ...product };
    },

    updateField<T extends keyof TProduct>(field: T, value: TProduct[T]) {
      (this.product as any)[field] = value;
    },
  },
});

// RPC функции для получения данных
export const useProductRPC = defineStore("product-rpc", {
  state: () => ({
    brands: [] as string[],
    categories: [] as string[],
    shops: [] as string[],
    volumes: [] as string[],
    priceRange: [0, 0] as [number, number],
  }),

  getters: {},

  actions: {
    async fetchAllOptions() {
      try {
        const response = await $fetch("/api/filter");
        this.brands = response.brands || [];
        this.categories = response.categories || [];
        this.shops = response.shops || [];
        this.volumes = response.volumes || [];
        this.priceRange = [
          response.priceRange?.[0] || 0,
          response.priceRange?.[1] || 0,
        ];
      } catch (error) {
        console.error("Ошибка получения фильтров:", error);
      }
    },
  },
});
