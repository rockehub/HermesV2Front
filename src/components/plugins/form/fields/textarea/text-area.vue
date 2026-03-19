<script setup lang="ts">
import type { BaseFieldProps, TextareaFieldSchema } from '@/classes/form/schemas'
import { resolveComponent } from 'vue'
import { resolveVisualBuilderMode } from '@/bin/platform/hermes/utils/commerceFlowBuilders'

const props = defineProps<BaseFieldProps<TextareaFieldSchema> & { params: any }>()

const findSubField = () => {
  const code = props.params?.config?.code as string | undefined
  if (resolveVisualBuilderMode(code)) {
    return resolveComponent('form-fields-textarea-sub-commerce-builder')
  }

  switch (props.params?.config?.type) {
    case 'editor':
      return resolveComponent('form-fields-textarea-sub-editor-main')
    case 'simple':
    default:
      return resolveComponent('form-fields-textarea-sub-simple')
  }
}
</script>

<template>
  <component :is="findSubField()" :params="params" :field="field" :initialValues="initialValues" :schema="schema" />
</template>
