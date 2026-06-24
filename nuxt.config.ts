// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  telemetry: false,
  modules: ["@nuxt/ui", "@nuxtjs/supabase", "@pinia/nuxt"],
  css: ["~/assets/css/main.css"],
  pinia: {
    storesDirs: ["./app/stores"],
  },
  appConfig: {
    ui: {
      icons: {
        close: "material-symbols:close-rounded",
      },
    },
  },
  vite: {
    optimizeDeps: {
      include: [
        "@internationalized/date",
        "@vue/devtools-core",
        "@vue/devtools-kit",
        "browser-image-compression",
      ],
    },
  },
});
