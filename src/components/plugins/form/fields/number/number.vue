<script setup lang="ts">
import type { BaseFieldProps, OptionFieldSchema } from '@/classes/form/schemas'
import { resolveComponent } from 'vue'
import type { RegisteredField } from '@/classes/form/FieldRegistry'
import NumberField from '@/components/plugins/form/fields/number/sub/number.vue'
import RangeField from '@/components/plugins/form/fields/number/sub/range.vue'
import CurrencyField from '@/components/plugins/form/fields/number/sub/currency.vue'
import QuantityField from '@/components/plugins/form/fields/number/sub/quantity.vue'
const props = defineProps<BaseFieldProps<RegisteredField<'options'>>>()

const findSubField = (type: string) => {
  switch (type) {
    case 'number':
      return NumberField
    case 'range':
      return RangeField
    case 'currency':
      return CurrencyField
    case 'quantity':
      return QuantityField
    default:
      return NumberField
  }
}
</script>

<template>
  <component
    :is="findSubField(params.config.type)"
    :params="params"
    :field="field"
    :initialValues="initialValues"
    :schema="schema"
  />
</template>

<style scoped></style>
