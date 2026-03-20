<template>
  <div
    class="flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-white px-5 py-5 md:flex-row md:items-center md:justify-between dark:border-navy-600 dark:bg-navy-800"
  >
    <div class="text-lg font-semibold text-slate-800 dark:text-navy-50">
      {{ configuration?.title || 'Chamada principal' }}
    </div>
    <div class="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white">
      {{ configuration?.buttonLabel || 'Saiba mais' }}
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{ configuration?: Record<string, any>; isEditorPreview?: boolean }>()
</script>
