<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCrud } from '../../composables/useCrud'
import { useDynamicFormSchema } from '../../composables/useDynamicFormSchema'
import FormGenerator from '@/components/plugins/form/generator.vue'
import type { RegisteredField } from '@/classes/form/FieldRegistry'

const props = defineProps<{ resource: string }>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const { create, update, fetchById, loading: saving } = useCrud<Record<string, any>>(props.resource)

const { schema, loading: loadingSchema, loadSchema } = useDynamicFormSchema()

const formData = ref<Record<string, any>>({})
const loadingRecord = ref(false)

const recordId = computed(() => route.params.id as string | undefined)
const isEditing = computed(() => !!recordId.value)
const formContext = computed<'create' | 'update'>(() => (isEditing.value ? 'update' : 'create'))

const backRoute = computed(() => ({
  name: 'cockpit',
  params: {
    cockpit: route.params.cockpit,
    ...(route.params.sub ? { sub: route.params.sub } : {})
  }
}))

const entityLabel = computed(() => {
  if (schema.value?.formName) {
    const key = `forms.${schema.value.formName}.formName`
    const translated = t(key)
    return translated !== key ? translated : props.resource
  }
  return props.resource
})

/**
 * Form só pode renderizar quando:
 * - schema carregou
 * - se estiver editando, o registro já foi buscado
 */
const isFormReady = computed(() => {
  if (loadingSchema.value) return false
  if (isEditing.value && loadingRecord.value) return false
  return !!schema.value
})

onMounted(async () => {
  await loadSchema(props.resource)

  if (recordId.value) {
    loadingRecord.value = true
    try {
      formData.value = await fetchById(recordId.value)
    } finally {
      loadingRecord.value = false
    }
  }
})

const handleSubmit = async (data: any) => {
  if (!schema.value) return

  // Separate scalar fields from relation fields
  const allFields = schema.value.getFields()
  const relationFields = allFields.filter((f: RegisteredField) => f.config.fieldType === 'relation')
  const relationKeys = new Set(relationFields.map((f: RegisteredField) => f.config.code as string))

  const scalarPayload: Record<string, any> = {}
  const toManyPayload: Record<string, string[]> = {}
  const toOnePayload: Record<string, string> = {}

  for (const [key, value] of Object.entries(data)) {
    if (!relationKeys.has(key)) {
      scalarPayload[key] = value
    } else {
      const field = relationFields.find((f: RegisteredField) => f.config.code === key)
      const relType = field?.config?.relation?.type as string | undefined
      if (relType === 'many-to-many' || relType === 'one-to-many') {
        if (Array.isArray(value) && value.length > 0) {
          toManyPayload[key] = value as string[]
        }
      } else if (relType === 'many-to-one' || relType === 'one-to-one') {
        if (value) {
          toOnePayload[key] = value as string
        }
      }
    }
  }

  let savedId: string
  if (isEditing.value && recordId.value) {
    await update(recordId.value, scalarPayload)
    savedId = recordId.value
  } else {
    const created = await create(scalarPayload)
    savedId = (created as any).id
  }

  // Associate to-many relations via text/uri-list (PUT)
  for (const [relation, ids] of Object.entries(toManyPayload)) {
    await schema.value.replaceToMany(savedId, relation, ids)
  }

  // Associate to-one relations via text/uri-list (PUT)
  for (const [relation, targetId] of Object.entries(toOnePayload)) {
    await schema.value.associateToOne([savedId, relation, targetId])
  }

  router.push(backRoute.value)
}
</script>

<template>
  <!-- Breadcrumb + Back button -->
  <div class="mb-4 flex items-center gap-3">
    <RouterLink
      :to="backRoute"
      class="btn h-8 w-8 shrink-0 rounded-full p-0 text-slate-500 hover:bg-slate-100 dark:text-navy-300 dark:hover:bg-navy-600"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </RouterLink>

    <nav class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-navy-300">
      <RouterLink
        :to="backRoute"
        class="transition-colors hover:text-primary dark:hover:text-accent"
      >
        {{ entityLabel }}
      </RouterLink>
      <span class="text-slate-300 dark:text-navy-500">/</span>
      <span class="font-medium text-slate-700 dark:text-navy-100">
        {{ isEditing ? t('forms.commons.editing') : t('forms.commons.new') }}
      </span>
      <span v-if="isEditing && recordId" class="ml-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-400 dark:bg-navy-600 dark:text-navy-300">
        {{ recordId.slice(0, 8) }}…
      </span>
    </nav>
  </div>

  <div v-if="loadingSchema || loadingRecord" class="animate-pulse space-y-5 rounded-lg bg-white p-5 dark:bg-navy-700">
    <div class="flex items-center justify-between">
      <div class="h-4 w-40 rounded bg-slate-200 dark:bg-navy-500"></div>
      <div class="h-9 w-24 rounded-lg bg-slate-200 dark:bg-navy-500"></div>
    </div>
    <div class="grid grid-cols-12 gap-x-4 gap-y-5">
      <div class="col-span-6 space-y-1.5">
        <div class="h-3 w-20 rounded bg-slate-200 dark:bg-navy-500"></div>
        <div class="h-9 rounded-lg bg-slate-150 dark:bg-navy-500"></div>
      </div>
      <div class="col-span-6 space-y-1.5">
        <div class="h-3 w-24 rounded bg-slate-200 dark:bg-navy-500"></div>
        <div class="h-9 rounded-lg bg-slate-150 dark:bg-navy-500"></div>
      </div>
      <div class="col-span-12 space-y-1.5">
        <div class="h-3 w-16 rounded bg-slate-200 dark:bg-navy-500"></div>
        <div class="h-24 rounded-lg bg-slate-150 dark:bg-navy-500"></div>
      </div>
    </div>
  </div>

  <template v-else-if="isFormReady">
    <div v-if="resource === 'product' && isEditing" class="mb-4 flex justify-end">
      <RouterLink
        :to="{ name: 'product-media', params: { productId: recordId } }"
        class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-indigo-400 hover:text-indigo-600 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        Gerenciar Mídias
      </RouterLink>
    </div>

    <form-generator
      :schema="schema"
      :initial-values="formData"
      :saving="saving"
      :context="formContext"
      @on-submit="handleSubmit"
    />
  </template>
</template>
