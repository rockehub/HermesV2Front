<script setup lang="ts">
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import type { BaseFieldProps, TextareaFieldSchema } from '@/classes/form/schemas'
import htmlEditButton from 'quill-html-edit-button'
import { ref, watch } from 'vue'

const props = defineProps<BaseFieldProps<TextareaFieldSchema>>()
const data = ref(props.initialValues?.[props.params.code])
const emit = defineEmits(['update:modelValue'])
const modules = {
  name: 'htmlEditButton',
  module: htmlEditButton,
  options: {}
}

const collectFieldValues = () => {
  emit('update:modelValue', data.value)
}

watch(() => data.value, collectFieldValues, { deep: true, immediate: true })
</script>

<template>
  <QuillEditor theme="snow" v-model:content="data" :modules="modules" contentType="html" />
</template>

<style scoped></style>
