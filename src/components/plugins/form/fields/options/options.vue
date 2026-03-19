<script setup lang="ts">
import type { BaseFieldProps, OptionFieldSchema } from '@/classes/form/schemas'
import { type Component, ref, resolveComponent, watch } from 'vue'
import type { RegisteredField } from '@/classes/form/FieldRegistry'
import type { AbstractFormSchema } from '@/classes/form/AbstractFormSchema'
import CheckboxField from '@/components/plugins/form/fields/options/sub/checkbox.vue'
import RadioField from '@/components/plugins/form/fields/options/sub/radio.vue'
import SelectField from '@/components/plugins/form/fields/options/sub/select.vue'
import DatalistField from '@/components/plugins/form/fields/options/sub/datalist.vue'
import SwitchField from '@/components/plugins/form/fields/options/sub/switch.vue'
const props = defineProps<BaseFieldProps<RegisteredField<'options'>>>()

const noNeedOptions = ['switch']
function toFunctionName(str: string, action = 'get') {
  return (
    action +
    str
      .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
      .replace(/^([a-z])/g, (match, letter) => letter.toUpperCase())
  )
}

const retrieveOptions = async () => {
  const methodName = toFunctionName(
    props.params.config.code + 'Options'
  ) as keyof AbstractFormSchema<any>

  const method = props.schema[methodName]

  if (typeof method === 'function') {
    return await method(props?.initialValues?.id)
  }

  console.error(`No Method ${String(methodName)} Found`)
  return []
}

const options = ref<
  void | AbstractFormSchema<any> | Record<string, any> | FormData | RegisteredField[]
>([])

watch(
  () => props.params.config.code,
  async (newCode, oldCode) => {
    if (newCode !== oldCode) {
      if (props.params.config.options === undefined) {
        if (!noNeedOptions.includes(props.params.config.type)) {
          options.value = await retrieveOptions()
        } else {
          options.value = []
        }
      } else {
        options.value = props.params.config.options
      }
    }
  },
  { immediate: true }
)

const FIELD_COMPONENTS: Record<string, Component> = {
  checkbox: CheckboxField,
  radio: RadioField,
  select: SelectField,
  datalist: DatalistField,
  switch: SwitchField
}

const findSubField = (type: string): Component => {
  return FIELD_COMPONENTS[type] || SelectField
}
</script>

<template>
  <component
    :is="findSubField(params.config.type)"
    :options="options"
    :params="params"
    :field="field"
    :initialValues="initialValues"
  />
</template>

<style scoped></style>
