<script setup lang="ts">
import type { BaseFieldProps, SearchFieldSchema } from '@/classes/form/schemas'

const props = defineProps<BaseFieldProps<RegisteredField<'search'>>>()
const { t } = useI18n()
const fieldValue = ref('')

import { useField } from 'vee-validate'
import { useI18n } from 'vue-i18n'
import { ref, watch } from 'vue'
import Box from '@/components/plugins/form/fields/search/sub/box.vue'
import type { RegisteredField } from '@/classes/form/FieldRegistry'

const { value, setValue } = useField(props.params.config.code)

watch(
  () => fieldValue.value,
  (value) => {
    setValue(value)
  }
)
</script>

<template>
  <box
    v-model="fieldValue"
    :initial-values="initialValues"
    :schema="schema"
    :field="field"
    :params="params"
  />
</template>

<style scoped></style>
