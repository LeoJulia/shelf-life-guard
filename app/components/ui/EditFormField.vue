<script setup lang="ts">
const { label, required, help } = defineProps(["label", "required", "help"]);
</script>

<template>
  <UFormField
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
