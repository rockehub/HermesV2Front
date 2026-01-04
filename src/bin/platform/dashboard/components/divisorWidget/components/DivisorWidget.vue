<script setup lang="ts">
const props = defineProps<{ initialConfiguration?: Record<string, any> }>()

</script>

<template>
  <h2 class="line-clamp-1 px-3 text-xs+ font-medium tracking-wide text-slate-700 dark:text-navy-100"> {{initialConfiguration?.name ?? 'teste'}} </h2>
</template>

<style scoped>

</style>