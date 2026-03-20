<template>
  <div
    class="flex items-center justify-center rounded-[20px] border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400 dark:border-navy-600 dark:bg-navy-800 dark:text-navy-400"
    :style="{ height: `${Number(configuration?.height || 32)}px` }"
  >
    Spacer {{ Number(configuration?.height || 32) }}px
  </div>
</template>

<script lang="ts" setup>
defineProps<{ configuration?: Record<string, any>; isEditorPreview?: boolean }>()
</script>
