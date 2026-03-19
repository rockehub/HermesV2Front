<script setup lang="ts">
import type { AbstractFormSchema } from '@/classes/form/AbstractFormSchema'
import { useForm } from 'vee-validate'
import type { BaseFieldSchema, FieldCondition } from '@/classes/form/schemas'
import { evaluateCondition } from '@/classes/form/FieldValidatorUtils'
import { ConditionEvaluator } from '@/classes/form/ConditionEvaluator'
import { ref, watch, watchEffect } from 'vue'
import type { FieldType, RegisteredField } from '@/classes/form/FieldRegistry'

const props = defineProps<{
  fields: RegisteredField<any>[]
  schema?: AbstractFormSchema<any>
  initialValues: any
}>()

const emit = defineEmits(['update:modelValue'])
const filteredFields = ref<RegisteredField<any>[]>([])

const { values, handleSubmit, setErrors } = useForm({
  initialValues: props.initialValues
})

const collectFieldValues = () => {
  emit('update:modelValue', { ...values })
}

watchEffect(() => {
  filteredFields.value = props.fields?.filter((field: RegisteredField<FieldType>) => {
    const condition = field.config.condition
    if (condition instanceof ConditionEvaluator) {
      return condition.handle(values)
    }

    if (!condition) return true

    const evaluated = evaluateCondition(condition as FieldCondition, values)

    if (evaluated) {
      return 'action' in condition ? condition.action === 'show' : false
    }

    return false
  })
})

watch(values, collectFieldValues, { deep: true, immediate: true })
</script>

<template>
  <form class="grid grid-cols-12 gap-4">
    <plugins-form-form-fields
      :initial-values="initialValues"
      :fields="filteredFields"
      :schema="schema"
    />
  </form>
</template>

<style scoped></style>
