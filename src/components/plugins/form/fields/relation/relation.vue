<script lang="ts" setup>
import type { BaseFieldProps, RelationFieldSchema } from '@/classes/form/schemas'
import { DynamicMethodsUtils } from '@/classes/form/DynamicMethodsUtils'
import { onMounted, ref, resolveComponent } from 'vue'
import type { RegisteredField } from '@/classes/form/FieldRegistry'
import RecordField from '@/components/plugins/form/fields/relation/sub/record.vue'
import ListField from '@/components/plugins/form/fields/relation/sub/list.vue'
import OptionList from '@/components/plugins/form/fields/options/sub/select.vue'

const props = defineProps<BaseFieldProps<RegisteredField<'relation'>>>()

const data = ref<any[]>([])
const loading = ref(true)

const retrieveData = async () => {
  loading.value = true
  return await DynamicMethodsUtils.invoke(props.schema, props.params.config.code, 'get', 'Data')
}

onMounted(async () => {
  if (props.params.config.useExternalData) {
    data.value = await retrieveData()
    loading.value = false
  } else {
    console.log(props?.initialValues?.[props.params.config.code])
    data.value = Object.values(props?.initialValues?.[props.params.config.code] ?? [])
    loading.value = false
  }
})

const findSubField = (type: string) => {
  switch (type) {
    case 'list':
      return ListField
    case 'record':
      return RecordField
    default:
      return OptionList
  }
}
</script>

<template>
  <component
    :is="findSubField(params.config.type)"
    v-if="!loading"
    :field="field"
    :initialValues="data.length > 0 ? data : initialValues"
    :params="params"
    :schema="schema"
  />
</template>

<style scoped></style>
