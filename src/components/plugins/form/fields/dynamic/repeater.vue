<script setup lang="ts">
import type { BaseFieldProps, DynamicFieldSchema } from '@/classes/form/schemas'
import { DynamicMethodsUtils } from '@/classes/form/DynamicMethodsUtils'
import { useField } from 'vee-validate'
import { ref, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RegisteredField } from '@/classes/form/FieldRegistry'

const props = defineProps<BaseFieldProps<RegisteredField<'dynamic'>>>()
const { t } = useI18n()
let initialRef = ref(props.initialValues?.[props.params?.config.initialValuesProperty])

const formInstances = reactive<
  { id: number; fieldValue: any[]; dynamicSchema: any[]; loading: boolean; initialValues: any }[]
>([])
let instanceCounter = 0

const addForm = async (index: number) => {
  try {
    if (initialRef.value == null && !props.params.config.shouldUseInCreate) return
    let initV
    if (initialRef.value) {
      initV = Object.values(initialRef.value)?.[index]
    } else {
      initV = []
    }

    let id = props?.initialValues?.id
    const dynamicSchema = await DynamicMethodsUtils.invoke(
      props.schema,
      props.params.config.code,
      'get',
      'DynamicSchema',
      id
    )

    const newInstance = reactive({
      id: instanceCounter++,
      fieldValue: [],
      dynamicSchema,
      loading: false,
      initialValues: initV
    })

    formInstances.push(newInstance)
  } catch (e) {
    console.error('Erro ao adicionar formulário:', e)
  }
}

const removeForm = (index: number) => {
  formInstances.splice(index, 1)
}

const { value, setValue } = useField(props.params.config.code)

watch(
  () => formInstances.map((item) => item.fieldValue),
  (updatedValue) => {
    setValue(updatedValue)
  },
  { deep: true }
)

const initialData = props.initialValues?.[props.params?.config.initialValuesProperty]

if (initialData) {
  Object.values(initialData).forEach((item, index) => {
    addForm(index)
  })
}
</script>

<template>
  <div>
    <div
      v-for="(instance, index) in formInstances"
      :key="instance.id"
      class="mb-6 p-4 rounded-lg border border-slate-200 dark:border-navy-500"
    >
      <div class="flex justify-end w-[100%]">
        <button
          type="button"
          @click="removeForm(index)"
          class="btn rounded-lg border border-error px-2 py-1 font-medium text-error hover:bg-error hover:text-white focus:bg-error focus:text-white active:bg-error/90 dark:border-error dark:text-error dark:hover:bg-error dark:hover:text-white mb-2"
        >
          <icon-trash-lines />
        </button>
      </div>

      <div v-if="!instance.loading">
        <div v-if="instance.dynamicSchema.length">
          <plugins-form-fields-dynamic-sub-fields
            v-model="instance.fieldValue"
            :schema="schema"
            :fields="instance.dynamicSchema"
            :initial-values="instance.initialValues"
          />
        </div>
        <div v-else class="text-center">
          <span>{{ t('no.dynamic.fields') }}</span>
        </div>
      </div>
      <div v-else class="w-full flex justify-center">
        <div class="w-5 h-5 relative text-center">
          <span class="w-4 h-4 m-auto mb-10">
            <span class="animate-ping inline-flex h-full w-full rounded-full bg-info"></span>
          </span>
        </div>
      </div>
    </div>
    <button
      type="button"

      @click="addForm"
      class="btn w-full rounded-lg border border-primary px-4 py-2 font-medium text-primary hover:bg-primary hover:text-white focus:bg-primary focus:text-white active:bg-primary/90 dark:border-accent dark:text-accent-light dark:hover:bg-accent dark:hover:text-white dark:focus:bg-accent dark:focus:text-white mb-4"
    >
      {{ t('forms.commons.add') }}
    </button>
  </div>
</template>

<style scoped>
button {
  transition: all 0.3s;
}

button:hover {
  opacity: 0.8;
}
</style>
