<template>
  <div v-for="fieldSchema in fields" :class="`col-span-${fieldSchema.config.span}`">
    <label
      v-if="
        !(
          nonNeedsLabel.includes(fieldSchema.fieldType) ||
          nonNeedsLabel.includes(fieldSchema.config.type)
        )
      "
      :for="fieldSchema.config.code"
      class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100"
      >{{ t(fieldSchema.config.label) }}</label
    >
    <Field
      v-if="!unWrapTypes.includes(fieldSchema.config.type)"
      v-slot="{ field, errorMessage, value }"
      :label="fieldSchema.config.label"
      :name="fieldSchema.config.code"
      :validateOnBlur="false"
      :validateOnChange="false"
      :validateOnInput="false"
      @blur="onblur(fieldSchema)"
    >
      <div
        :class="{
          'has-error': errorMessage != undefined,
          'has-success': value != undefined && errorMessage == undefined
        }"
      >
        <component
          :is="fieldFinder(fieldSchema.fieldType)"
          :id="fieldSchema.config.code"
          :field="field"
          :initialValues="initialValues"
          :params="fieldSchema"
          :schema="schema!"
        />
      </div>
    </Field>

    <component
      :is="fieldFinder(fieldSchema.fieldType)"
      v-else
      :id="fieldSchema.config.code"
      :field="null"
      :initial-values="initialValues"
      :params="fieldSchema"
      :schema="schema!"
    />
    <ErrorMessage v-slot="{ message }" :name="fieldSchema.config.code">
      <span class="mt-1 block text-xs text-error">
        {{ t(message!.toString(), { field: label(fieldSchema) }) }}
      </span>
    </ErrorMessage>
  </div>
</template>
<script lang="ts" setup>
import { ErrorMessage, Field } from 'vee-validate'
import type { AbstractFormSchema } from '@/classes/form/AbstractFormSchema'
import { resolveComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import TextField from '@/components/plugins/form/fields/text/text.vue'
import OptionsField from '@/components/plugins/form/fields/options/options.vue'
import FileField from '@/components/plugins/form/fields/file/file.vue'
import SubformField from '@/components/plugins/form/fields/subform/subform.vue'
import LayoutField from '@/components/plugins/form/fields/layout/layout.vue'
import RelationField from '@/components/plugins/form/fields/relation/relation.vue'
import TextareaField from '@/components/plugins/form/fields/textarea/text-area.vue'
import DynamicField from '@/components/plugins/form/fields/dynamic/dynamic.vue'
import RepeaterField from '@/components/plugins/form/fields/dynamic/repeater.vue'
import NumberField from '@/components/plugins/form/fields/number/number.vue'
import SearchField from '@/components/plugins/form/fields/search/search.vue'
import MapField from '@/components/plugins/form/fields/map/map-field.vue'
import type { FieldType, RegisteredField } from '@/classes/form/FieldRegistry'

let emit = defineEmits(['onBlur'])
const props = defineProps<{
  fields: RegisteredField<any>[]
  schema?: AbstractFormSchema<any>
  initialValues: any
}>()
const { t } = useI18n()

const onblur = (event: any) => {
  emit('onBlur', event)
}

const fieldFinder = (type: string) => {
  switch (type) {
    case 'text':
      return TextField
    case 'options':
      return OptionsField
    case 'file':
      return FileField
    case 'subform':
      return SubformField
    case 'layout':
      return LayoutField
    case 'relation':
      return RelationField
    case 'textarea':
      return TextareaField
    case 'dynamic':
      return DynamicField
    case 'repeater':
      return RepeaterField
    case 'number':
      return NumberField
    case 'search':
      return SearchField
    case 'map':
      return MapField
    default:
      return TextField
  }
}

const unWrapTypes = ['checkbox', 'file', 'modal', 'literal', 'radio', 'request', 'editor']

const nonNeedsLabel = ['layout', 'subform', 'dynamic', 'hidden']

const label = (field: RegisteredField<any>) => {
  return t(field.config.label)
}
</script>
