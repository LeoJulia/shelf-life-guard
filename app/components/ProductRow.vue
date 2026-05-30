<script setup>
defineProps(['field', 'value']);
</script>

<template>
  <div>
    <span class="font-mono">{{ field }}:</span>
    {{ value ?? "-" }}
  </div>
</template>