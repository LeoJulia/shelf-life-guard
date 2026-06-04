<script setup>
defineProps(['field', 'value']);
</script>

<template>
  <div class="grid grid-cols-4 gap-2">
    <span class="font-mono">{{ field }}:</span>
    <span class="col-span-3">{{ value ?? "-" }}</span>
  </div>
</template>