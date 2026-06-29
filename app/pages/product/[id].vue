<script setup lang="ts">
import type { TProduct } from "~/types/product.types";
import Rating from "~/components/ui/Rating.vue";
import ProgressBar from "~/components/ui/ProgressBar.vue";
import Tags from "~/components/ui/Tags.vue";

const router = useRouter();
const route = useRoute();

const { data: product } = await useFetch<TProduct>("/api/product", {
  query: { id: route.params.id },
});

const onDeleteProduct = async () => {
  await $fetch(`/api/products/${route.params.id}`, {
    method: "DELETE",
  });

  await refreshNuxtData();
  await navigateTo("/dashboard");
};
</script>

<template>
  <main class="mx-auto max-w-7xl px-6 py-8">
    <div v-if="product">
      <div class="flex justify-between pb-2">
        <UButton color="neutral" variant="ghost" @click="router.back()">
          <UIcon name="mage:arrow-left-square" class="size-8" />
          Назад
        </UButton>

        <UButton color="neutral" variant="ghost" @click="onDeleteProduct">
          <UIcon name="mage:box-cross" class="size-8" />
        </UButton>

        <ProductForm :product="product">
          <UButton color="neutral" variant="ghost">
            <UIcon name="mage:edit" class="size-8" />
          </UButton>
        </ProductForm>
      </div>
      <div
        class="md:grid md:grid-cols-3 gap-2 group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
      >
        <div class="col-span-2">
          <div class="mb-6">
            <span
              class="text-s font-medium uppercase tracking-wider text-muted-foreground"
            >
              {{ product?.brand }}
            </span>
            <h2 class="mt-0.5 text-base font-semibold leading-tight text-foreground">
              {{ product?.name }}
            </h2>
          </div>

          <Rating :rating="product.rating" />
          <Tags :product="product" />
          <ProgressBar :product="product" />

          <div class="flex flex-col divide-y mt-4">
            <ProductRow field="Комментарий" :value="product?.notes" />
            <ProductRow field="Состав" :value="product?.ingredients" />
            <ProductRow field="Рыночная стоимость" :value="product?.market_price" />
            <ProductRow field="Стоимость покупки" :value="product?.actual_price" />
            <ProductRow field="Магазин покупки" :value="product?.shop" />
            <ProductRow
              v-if="product?.opened_at"
              field="Дата начала использования"
              :value="
                new Date(product.opened_at).toLocaleDateString('ru-RU', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              "
            />
            <ProductRow
              v-if="product?.finished_at"
              field="Дата окончания использования"
              :value="
                new Date(product.finished_at).toLocaleDateString('ru-RU', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              "
            />
            <ProductRow
              v-if="product?.expiry_date"
              field="Срок годности"
              :value="
                new Date(product.expiry_date).toLocaleDateString('ru-RU', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              "
            />
          </div>
        </div>
        <div
          class="relative h-auto w-full flex-shrink-0 overflow-hidden rounded-lg bg-input"
        >
          <img
            :src="product?.imageUrl"
            :alt="product.name"
            fill
            class="object-cover transition-transform duration-300 group-hover:scale-105 h-full"
          />
        </div>
      </div>
    </div>
    <div v-else>
      <div class="mt-12 flex flex-col items-center justify-center text-center">
        <UIcon name="mage:package-box" class="h-12 w-12 text-muted-foreground" />
        <h3 class="mt-4 text-lg font-medium text-foreground">Упс... Ошибочка</h3>
        <p class="mt-1 mb-1 text-sm text-muted-foreground">
          Возможно это временна ошибка. Или баночки не существовало, а может она была
          удалена. Попробуйте открыть другую или добавить новую.
        </p>
        <NuxtLink to="/dashboard">На главную</NuxtLink>
      </div>
    </div>
  </main>
</template>
