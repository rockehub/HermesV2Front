<script setup lang="ts">
import type { OptionsPropsSchema } from '@/classes/form/schemas'
import { Field } from 'vee-validate'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const props = defineProps<OptionsPropsSchema>()
</script>

<template>
  <div v-for="[id, name] in Object.entries(options)" :key="id">
    <label class="inline-flex items-center space-x-2">
      <Field
        type="checkbox"
        :name="params.code"
        class="form-checkbox is-basic h-5 w-5 rounded border-slate-400/70 checked:border-primary checked:bg-primary hover:border-primary focus:border-primary dark:border-navy-400 dark:checked:border-accent dark:checked:bg-accent dark:hover:border-accent dark:focus:border-accent"
        :value="id"
        :unchecked-value="false"
      />
      <span>{{ name }}</span>
    </label>
  </div>
</template>

<style scoped></style>
