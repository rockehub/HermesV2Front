<script setup lang="ts">
import type { BaseFieldProps, DynamicFieldSchema } from '@/classes/form/schemas'
import { DynamicMethodsUtils } from '@/classes/form/DynamicMethodsUtils'
import { useField } from 'vee-validate'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RegisteredField } from '@/classes/form/FieldRegistry'

const fieldValue = ref([])

const loading = ref(false)
const props = defineProps<BaseFieldProps<RegisteredField<'dynamic'>>>()

let dynamicSchema = ref<any>([])
const { t } = useI18n()
watch(
  () => props.params.config.code,
  async (newCode, oldCode) => {
    if (newCode !== oldCode) {
      loading.value = true
      let id = props?.initialValues?.id
      if (id || props.params.config.shouldUseInCreate) {
        dynamicSchema.value = await DynamicMethodsUtils.invoke(
          props.schema,
          props.params.config.code,
          'get',
          'DynamicSchema',
          id
        )
      }
      loading.value = false
    }
  },
  { immediate: true }
)

const { value, setValue } = useField(props.params.config.code)

watch(
  () => fieldValue.value,
  (value) => {
    setValue(value)
  }
)
</script>

<template>
  <div v-if="loading == false">
    <div v-if="dynamicSchema">
      <plugins-form-fields-dynamic-sub-fields
        v-model="fieldValue"
        :schema="schema"
        :fields="dynamicSchema"
        :initial-values="initialValues?.[params?.config.initialValuesProperty]"
      />
    </div>
    <div v-else class="text-center">
      <span>{{ t('no.dynamic.fields') }}</span>
    </div>
  </div>
  <div v-else class="w-full flex justify-center">
    <div class="w-5 h-5 relative text-center">
      <span class="w-4 h-4 m-auto mb-10"
        ><span class="animate-ping inline-flex h-full w-full rounded-full bg-info"></span
      ></span>
    </div>
  </div>
</template>

<style scoped></style>
