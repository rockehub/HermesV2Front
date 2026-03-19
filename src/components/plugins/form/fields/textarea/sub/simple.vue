<script setup lang="ts">
import type { BaseFieldProps, TextareaFieldSchema } from '@/classes/form/schemas'

defineProps<BaseFieldProps<TextareaFieldSchema>>()
</script>

<template>
  <textarea
    v-bind="field"
    name="comment"
    rows="4"
    class="form-textarea w-full resize-none rounded-lg border border-slate-300 bg-transparent p-2.5 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
  />
</template>

<style scoped></style>
