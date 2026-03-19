<script setup lang="ts">
import type { OptionsPropsSchema } from '@/classes/form/schemas'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const props = defineProps<OptionsPropsSchema>()

const isI18nKey = (value: string) => {
  return /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)+$/.test(value)
}
</script>

<template>
  <select
    class="form-select w-full rounded-lg border border-slate-300 bg-white px-3 py-2 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
    :size="params.size"
    :multiple="params.multiple"
    v-bind="field"
  >
    <option :selected="true" v-if="!params.noEmptyOption || options.length == 1">
      {{ t('forms.commons.select') }}
    </option>
    <option :selected="false" :value="option.id" v-for="option in options">
      {{ isI18nKey(option.name) ? t(option.name) : option.name }}
    </option>
  </select>
</template>

<style scoped></style>
