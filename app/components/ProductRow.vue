<script setup>
defineProps(["field", "value"]);
</script>

<template>
  <div class="grid grid-cols-2 gap-2">
    <span class="font-mono">{{ field }}:</span>
    <span>{{ value ?? "-" }}</span>
  </div>
</template>
