<template>
  <div
    class="rounded-[20px] border border-slate-200 bg-white p-3 dark:border-navy-600 dark:bg-navy-800"
  >
    <img
      :src="configuration?.src || 'https://placehold.co/1200x600'"
      :alt="configuration?.alt || 'Imagem da secao'"
      class="h-[220px] w-full rounded-[16px] object-cover"
    />
    <div class="mt-2 text-xs text-slate-400 dark:text-navy-400">
      {{ configuration?.alt || 'Imagem da secao' }}
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{ configuration?: Record<string, any>; isEditorPreview?: boolean }>()
</script>
