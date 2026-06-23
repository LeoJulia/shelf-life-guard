<script setup lang="ts">
defineProps(["rating"]);
</script>

<template>
  <div class="mt-1.5 mb-2 flex items-center gap-1">
    <div v-for="i in 5">
      <UIcon
        v-if="i <= (rating ?? 0)"
        name="mage:star-fill"
        class="size-5 fill-primary text-primary"
      />
      <UIcon v-else name="mage:star-fill" class="size-5 fill-muted bg-muted" />
    </div>
  </div>
</template>
