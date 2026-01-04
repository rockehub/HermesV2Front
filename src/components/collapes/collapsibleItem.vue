<template>
  <div class="collapsible-item">
    <!-- Header with toggle button -->
    <div
        @click="toggleExpand"
        class="flex cursor-pointer items-center justify-between bg-primary px-4 py-4 text-base font-medium text-white dark:bg-accent sm:px-5"
    >
      <!-- Slot for Custom Header -->
      <slot name="header">Default Header</slot>
      <div
          :class="expanded ? '-rotate-180' : ''"
          class="text-sm font-normal leading-none text-indigo-100 transition-transform duration-300"
      >
        <i class="fas fa-chevron-down"></i>
      </div>
    </div>

    <!-- Collapsible Content -->
    <div v-if="expanded" class="px-4 py-4 sm:px-5">
      <slot name="content">Default Content</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const expanded = ref(false);

function toggleExpand() {
  expanded.value = !expanded.value;
}
</script>

<style scoped>
/* Scoped styling for the component */
.collapsible-item {
  border-bottom: 1px solid #4f46e5;
}
</style>
