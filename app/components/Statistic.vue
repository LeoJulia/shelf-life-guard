<script setup lang="ts">
const { data } = await useFetch('/api/statistic');


const stats = [
  {
    label: "Всего продуктов",
    value: data?.value?.total,
    icon: "mage:package-box",
    // change: "",
    color: "bg-[oklch(0.92_0.08_340)] text-[oklch(0.45_0.12_340)]",
    iconBg: "bg-[oklch(0.85_0.1_340)]",
  },
  {
    label: "Потрачено за год",
    value: data?.value?.spentYear,
    icon: "solar:ruble-broken",
    // change: "",
    color: "bg-[oklch(0.92_0.08_165)] text-[oklch(0.4_0.1_165)]",
    iconBg: "bg-[oklch(0.85_0.1_165)]",
  },
  {
    label: "Открыто всего",
    value: data?.value?.openedTotal,
    icon: "solar:ruble-line-duotone",
    // change: "среди всех продуктов",
    color: "bg-[oklch(0.92_0.08_200)] text-[oklch(0.45_0.1_200)]",
    iconBg: "bg-[oklch(0.85_0.1_200)]",
  },
  {
    label: "Скоро просрок",
    value: data?.value?.expiring30Days,
    icon: "mage:clock",
    // change: "Within 30 days",
    color: "bg-[oklch(0.92_0.08_280)] text-[oklch(0.45_0.1_280)]",
    iconBg: "bg-[oklch(0.85_0.1_280)]",
  },
];

</script>

<template>
  <!-- {/* Stats Cards */} -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div v-for="stat in stats">
      <div :key="stat.label" :class="['rounded-2xl p-5', stat.color]">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium opacity-80">
            {{ stat.label }}
          </span>
          <div :class="['size-8 rounded-md p-1.5', stat.iconBg]">
            <UIcon :name="stat.icon" class="size-5 text-white" />
          </div>
        </div>
        <p class="mt-2 text-3xl font-bold">
          {{ stat.value }}
        </p>
        <!-- <p class="mt-1 text-xs font-medium opacity-70">{{ stat?.change }}</p> -->
      </div>
    </div>
  </div>
</template>