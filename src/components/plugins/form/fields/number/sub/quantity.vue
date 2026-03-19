<script setup lang="ts">
import { ref, watch } from 'vue'

import NumberSpinner from 'ts-vue3-number-spinner'
import { useField } from 'vee-validate'
import type { BaseFieldProps, NumberFieldSchema } from '@/classes/form/schemas'
import type { RegisteredField } from '@/classes/form/FieldRegistry'

const props = defineProps<BaseFieldProps<RegisteredField<'number'>>>()

const value4 = ref(0)

const { value, setValue } = useField(props.params.config.code)

watch(
  () => value4.value,
  (value) => {
    setValue(value)
  }
)
</script>

<template>
  <div class="flex">
    <button
      type="button"
      class="btn flex h-10 w-10 items-center justify-center rounded-l-lg border border-slate-300 bg-slate-150 font-medium text-slate-800 hover:bg-slate-200 focus:bg-slate-200 active:bg-slate-200/80 dark:border-navy-450 dark:bg-navy-500 dark:text-navy-50 dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90"
      @click="value4--"
    >
      <icon-minus />
    </button>
    <number-spinner
      v-model="value4"
      :min="0"
      :max="10000"
      :step="1"
      :keyStep="1"
      class="form-input w-full rounded-none border-x-0 border-slate-300 bg-transparent text-center dark:border-navy-450"
    />
    <button
      type="button"
      class="btn flex h-10 w-10 items-center justify-center rounded-r-lg border border-slate-300 bg-slate-150 font-medium text-slate-800 hover:bg-slate-200 focus:bg-slate-200 active:bg-slate-200/80 dark:border-navy-450 dark:bg-navy-500 dark:text-navy-50 dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90"
      @click="value4++"
    >
      <icon-plus />
    </button>
  </div>
</template>

<style scoped></style>
