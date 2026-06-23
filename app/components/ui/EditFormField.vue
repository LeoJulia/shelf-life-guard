<script setup lang="ts">
const { label, required, help, name } = defineProps([
  "label",
  "required",
  "help",
  "name",
]);
</script>

<template>
  <UFormField
    :name="name"
    :required="required"
    :help="help"
    class="justify-start w-full mb-2"
    orientation="horizontal"
    :label="label"
    :ui="{ container: 'w-full', wrapper: 'w-40', help: 'text-muted-foreground' }"
  >
    <slot />
  </UFormField>
</template>
