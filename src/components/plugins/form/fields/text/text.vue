<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { BaseFieldProps } from '@/classes/form/schemas'
import type { RegisteredField } from '@/classes/form/FieldRegistry'

const props = defineProps<BaseFieldProps<RegisteredField<'text'>>>()

const { t } = useI18n()
const label = computed(() => {
  return t(props.params.config.label)
})
</script>

<template>
  <input
    :type="params.config.type"
    v-bind="field"
    class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
    :class="{ 'h-[50px]': params.config.type == 'color' }"
    :placeholder="t('form.commons.placeholder', { field: label })"
  />
</template>

<style scoped></style>
