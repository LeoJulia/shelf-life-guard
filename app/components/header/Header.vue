<script setup lang="ts">
const supabase = useSupabaseClient();

const onLogout = async () => {
  await supabase.auth.signOut();

  await navigateTo("/login");
};
</script>

<template>
  <header class="border-b border-border bg-card/50 backdrop-blur-sm">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
      <NuxtLink class="flex items-center gap-3" to="/dashboard">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.85_0.1_340)]"
        >
          <UIcon name="mage:package-box" class="size-6 text-white" />
        </div>
        <span class="text-lg font-semibold text-foreground"> Shelf Life Guard </span>
      </NuxtLink>

      <nav class="hidden items-center gap-6 md:flex">
        <a
          href="#"
          class="text-sm font-medium text-foreground transition-colors hover:text-primary"
        >
          Главная
        </a>
        <a
          href="#"
          class="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Продукты
        </a>
        <a
          href="#"
          class="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Рутина
        </a>
        <a
          href="#"
          class="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Аналитика
        </a>
      </nav>

      <div>
        <ProductForm>
          <UButton size="sm" class="gap-2">
            <UIcon name="mage:plus" class="size-6" />
            Добавить
          </UButton>
        </ProductForm>
        <UButton size="sm" class="ml-3 gap-2" @click="onLogout" variant="ghost">
          <UIcon name="mage:logout" class="size-6" />
          Выйти
        </UButton>
      </div>
    </div>
  </header>
</template>
