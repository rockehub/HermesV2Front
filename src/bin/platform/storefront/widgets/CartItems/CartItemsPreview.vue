<template>
  <div
    class="rounded-[20px] border border-slate-200 bg-white px-5 py-4 dark:border-navy-600 dark:bg-navy-800"
  >
    <div class="text-base font-semibold text-slate-800 dark:text-navy-50">Cart Items</div>
    <div class="mt-2 text-sm text-slate-500 dark:text-navy-300">Cart line items preview.</div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{ configuration?: Record<string, any>; isEditorPreview?: boolean }>()
</script>
