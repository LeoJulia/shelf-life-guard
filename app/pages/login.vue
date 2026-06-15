<script setup lang="ts">
import type { AuthFormField } from "@nuxt/ui";

const supabase = useSupabaseClient();

const fields = ref<AuthFormField[]>([
  {
    name: "email",
    type: "text",
    label: "Почта",
  },
  {
    name: "password",
    type: "password",
    label: "Пароль",
  },
]);

const onSubmit = async (payload) => {
  const { error } = await supabase.auth.signInWithPassword({
    email: payload.data.email,
    password: payload.data.password,
  });

  if (error) {
    console.error("error", error);
    return;
  }

  await navigateTo("/dashboard");
};
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm title="Вход" :fields="fields" class="max-w-md" @submit="onSubmit" />
    </UPageCard>
  </div>
</template>
