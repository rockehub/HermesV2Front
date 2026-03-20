<script setup lang="ts">
import type { OptionsPropsSchema, OptionsPropsSchema2 } from '@/classes/form/schemas'
import { Field } from 'vee-validate'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'

const { t } = useI18n()
const props = defineProps<OptionsPropsSchema2>()

const value = ref(false)
</script>

<template>
  <label class="inline-flex items-center space-x-2">
    <Field
      :name="params.config.code"
      :id="params.config.code"
      type="checkbox"
      :value="true"
      class="form-switch h-5 w-10 rounded-full bg-slate-300 before:rounded-full before:bg-slate-50 checked:bg-primary checked:before:bg-white dark:bg-navy-900 dark:before:bg-navy-300 dark:checked:bg-accent dark:checked:before:bg-white"
      :unchecked-value="false"
    />
  </label>
</template>

<style scoped></style>
