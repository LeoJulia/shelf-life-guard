<script setup lang="ts">
defineProps(['viewMode', 'setViewMode']);
</script>

<template>
  <!-- {/* Search and Filters */} -->
  <div class="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="relative flex-1 sm:max-w-md">
      <UIcon name="mage:search" class="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <input class="w-md h-8 pl-10 border border-border rounded-sm focus:bg-input"
        placeholder="Ищи продукты, бренды или теги..." />
    </div>

    <div class="flex items-center gap-2">
      <UButton variant="outline" size="sm" class="rounded-sm gap-2 text-foreground border-0.5 border-border">
        <UIcon name="mdi:filter-outline" class="size-5" />
        Фильтр
      </UButton>
      <UButton variant="outline" size="sm" class="rounded-sm gap-2 text-foreground border-0.5 border-border">
        <UIcon name="mage:filter" class="size-5" />
        Сортировка
      </UButton>
      <div class="ml-2 h-11 flex items-center rounded-sm border border-border bg-secondary/30 p-1">
        <button @click="() => setViewMode('grid')" :class="['h-8 rounded-sm p-1.5 transition-colors', viewMode === 'grid'
          ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']">
          <UIcon name="mingcute:grid-line" class="size-5" />
        </button>
        <button @click="() => setViewMode('list')" :class="['h-8 rounded-sm p-1.5 transition-colors', viewMode === 'list' ? 'bg-card text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground']">
          <UIcon name="ic:round-list" class="size-5" />
        </button>
      </div>
    </div>
  </div>
</template>