<script setup lang="ts">
import type { BaseFieldProps, NumberFieldSchema } from '@/classes/form/schemas'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import type { RegisteredField } from '@/classes/form/FieldRegistry'

const props = defineProps<BaseFieldProps<RegisteredField<'number'>>>()

const { t } = useI18n()
const label = computed(() => {
  return t(props.params.config.label)
})
</script>

<template>
  <input
    type="number"
    v-bind="field"
    class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
    :placeholder="t('form.commons.placeholder', { field: label })"
  />
</template>

<style scoped></style>
