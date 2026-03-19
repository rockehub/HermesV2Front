<script setup lang="ts">
import type { BaseFieldProps, SubFormFieldSchema } from '@/classes/form/schemas'
import { DynamicMethodsUtils } from '@/classes/form/DynamicMethodsUtils'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import ModalBase from '@/components/modal/modal-base.vue'
import Generator from '@/components/plugins/form/generator.vue'
import type { RegisteredField } from '@/classes/form/FieldRegistry'

const props = defineProps<BaseFieldProps<RegisteredField<'subform'>>>()

const { t } = useI18n()
const formRef = ref()

const initialValuesData = computed(() => {
  return props.initialValues?.[props.params!.config.initialValuesProperty!] ?? null
})

const triggerFormSubmit = () => {
  if (formRef.value?.submit) {
    formRef.value.submit()
  }
}

const onSubmit = (data: any) => {
  DynamicMethodsUtils.invoke(props.params.config.form, props.params.config.code, 'form', 'Submit', data)
}
</script>

<template>
  <modal-base v-if="params.config.type === 'modal'" :confirm-callback="triggerFormSubmit">
    <template #trigger>
      {{ t(params.config.label) }}
    </template>
    <template #content>
      <generator
        ref="formRef"
        :schema="params.config.form"
        @onSubmit="onSubmit"
        :no-submit-button="true"
        :initial-values="initialValuesData"
      />
    </template>
  </modal-base>

  <div v-if="params.config.type === 'literal'"></div>
</template>

<style scoped></style>
