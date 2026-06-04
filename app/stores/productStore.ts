import { defineStore } from "pinia";
import type { TProduct } from "~/types/product.types";

export const useProductStore = defineStore("product", {
  state: () => ({
    products: [] as TProduct[],
    loading: false,
    error: null as string | null,
    currentPage: 1,
    itemsPerPage: 10,
  }),

  getters: {
    totalPages: (state) => {
      return Math.ceil(state.products.length / state.itemsPerPage);
    },
    paginatedProducts: (state) => {
      const start = (state.currentPage - 1) * state.itemsPerPage;
      const end = start + state.itemsPerPage;
      return state.products.slice(start, end);
    },
  },

  actions: {
    setProducts(products: TProduct[]) {
      this.products = products;
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    clearProducts() {
      this.products = [];
    },

    addProduct(product: TProduct) {
      this.products.unshift(product);
    },

    updateProduct(updatedProduct: TProduct) {
      const index = this.products.findIndex((p) => p.id === updatedProduct.id);
      if (index !== -1) {
        this.products[index] = updatedProduct;
      }
    },

    deleteProduct(productId: number | string) {
      this.products = this.products.filter(
        (product) => product.id !== productId,
      );
    },

    fetchProducts(page = 1, limit = 10) {
      return new Promise<void>((resolve) => {
        this.setLoading(true);
        this.error = null;
        // Реализация будет зависеть от вашего API
        setTimeout(() => {
          this.setLoading(false);
          resolve();
        }, 100);
      });
    },
  },
});
