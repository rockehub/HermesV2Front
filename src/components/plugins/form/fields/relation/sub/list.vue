<script lang="ts" setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useFormContext } from 'vee-validate'

import { DynamicMethodsUtils } from '@/classes/form/DynamicMethodsUtils'
import { AfterTypes, type BaseFieldProps } from '@/classes/form/schemas'
import type { RegisteredField } from '@/classes/form/FieldRegistry'

type RowId = string | number
type TableRow = Record<string, unknown> & { id?: RowId }

type ModalRef = { openModal?: () => void; closeModal?: () => void }
type FormRef = { submit?: () => void }
type BaseTableRef = {
  getSelectedRows?: () => TableRow[]
  clearSelection?: () => void
  resetPagination?: () => void
}

const props = defineProps<BaseFieldProps<RegisteredField<'relation'>>>()
const form = useFormContext<Record<string, unknown>>()

const formRef = ref<FormRef | null>(null)
const updateBehavior = ref<ModalRef | null>(null)
const baseModal = ref<ModalRef | null>(null)
const addBehavior = ref<ModalRef | null>(null)
const tableRef = ref<BaseTableRef | null>(null)

const isLoading = ref(false)
const initialValues = ref<TableRow | null>(null)
const selectedRows = ref<TableRow[]>([])
const dataToTable = ref<TableRow[]>([])

const fieldCode = computed(() => props.params?.config?.code)
const parentId = computed<RowId | undefined>(() => {
  if (!props.initialValues || typeof props.initialValues !== 'object') return undefined
  return (props.initialValues as { id?: RowId }).id
})
const isDraftMode = computed(() => parentId.value === undefined || parentId.value === null)
const relationResourcePath = computed(() => props.params?.config?.relation?.resourcePath || props.params?.config?.code?.toLowerCase?.() || props.params?.config?.code)
const formSchema = computed(
  () => props.params?.config.formSchema ?? props.schema ?? ({} as unknown)
)

const normalizeRow = (row: unknown): TableRow => {
  if (!row || typeof row !== 'object') {
    return {}
  }

  const record = row as Record<string, unknown>
  const { _links, ...plainRow } = record as Record<string, unknown> & { _links?: unknown }
  return plainRow as TableRow
}

const uniqueRowsById = (rows: TableRow[]): TableRow[] => {
  const seen = new Set<RowId>()
  const withoutId: TableRow[] = []

  return rows.filter((row) => {
    if (row.id === undefined || row.id === null) {
      withoutId.push(row)
      return true
    }

    if (seen.has(row.id)) {
      return false
    }

    seen.add(row.id)
    return true
  })
}

const getDraftRowsFromInitialValues = (): TableRow[] => {
  const code = fieldCode.value
  if (!code || !props.initialValues || typeof props.initialValues !== 'object') {
    return []
  }

  const rawValue = (props.initialValues as Record<string, unknown>)[code]
  if (!Array.isArray(rawValue)) {
    return []
  }

  return rawValue.map((item) => {
    if (item && typeof item === 'object') {
      return normalizeRow(item)
    }

    return { id: item as RowId }
  })
}

const syncFieldValue = (rows: TableRow[] = dataToTable.value) => {
  const nextValue = rows
    .map((row) => row.id)
    .filter((id): id is RowId => id !== undefined && id !== null)

  if (fieldCode.value) {
    form?.setFieldValue?.(fieldCode.value, nextValue)
  }

  props.field?.onInput?.(nextValue)
  props.field?.onChange?.(nextValue)
}

const fetchTableData = async (): Promise<TableRow[]> => {
  if (isDraftMode.value) {
    return getDraftRowsFromInitialValues()
  }

  const response: any = await DynamicMethodsUtils.invoke(props.schema, 'entity', 'find', 'Record', [
    props.initialValues.id,
    fieldCode.value
  ])

  const code = props.params?.config.code?.toLowerCase?.()
  const resourcePath = relationResourcePath.value
  const rawData = response._embedded?.[code] || response._embedded?.[resourcePath] || response.content || response || []

  const data = Array.isArray(rawData)
    ? rawData.map((row: unknown) => normalizeRow(row))
    : [normalizeRow(rawData)]

  return uniqueRowsById(data)
}

const loadData = async () => {
  isLoading.value = true
  try {
    dataToTable.value = await fetchTableData()
    tableRef.value?.clearSelection?.()

    if (isDraftMode.value) {
      syncFieldValue(dataToTable.value)
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
    dataToTable.value = []
    if (isDraftMode.value) {
      syncFieldValue([])
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

watch(
  () => props.initialValues,
  () => {
    if (isDraftMode.value) {
      loadData()
    }
  },
  { deep: true }
)

// Verifica se precisa exibir coluna de acoes
const showActions = computed(() => {
  return (
    ((props.params?.config.removeBehavior && !props.params?.config.removeBehavior?.batch) ??
      false) ||
    !!props.params?.config.updateBehavior
  )
})

// Verifica se tem checkbox de selecao em lote
const hasCheckbox = computed(() => !!props.params?.config.removeBehavior?.batch)

// Handler de selecao
const onSelectionChange = (rows: TableRow[]) => {
  selectedRows.value = rows
}

// Handlers de formulario
const triggerFormSubmit = () => formRef.value?.submit?.()
const updateTriggerFormSubmit = () => formRef.value?.submit?.()

const onSubmit = async (data: unknown) => {
  try {
    const response = await DynamicMethodsUtils.invoke(
      formSchema.value,
      props.params?.config.code,
      'create',
      'Action',
      data,
      true
    )

    if (props.params?.config.createBehavior?.afterCreate === AfterTypes.useReturnData && response) {
      dataToTable.value = uniqueRowsById([...dataToTable.value, normalizeRow(response)])
      syncFieldValue(dataToTable.value)
    }

    baseModal.value?.closeModal?.()
  } catch (error: unknown) {
    console.error(error)
  }
}

const onSubmitUpdate = async (data: unknown) => {
  try {
    const currentId = initialValues.value?.id
    const response = await DynamicMethodsUtils.invoke(
      formSchema.value,
      props.params?.config.code,
      'update',
      'Action',
      [data, currentId],
      true
    )

    if (props.params?.config.updateBehavior?.afterUpdate === AfterTypes.useReturnData && response) {
      const updated = normalizeRow(response)
      const updatedId = updated.id

      if (updatedId !== undefined) {
        const index = dataToTable.value.findIndex((r) => r.id === updatedId)
        if (index !== -1) {
          dataToTable.value[index] = { ...dataToTable.value[index], ...updated }
          if (isDraftMode.value) {
            syncFieldValue(dataToTable.value)
          }
        }
      }
    }

    updateBehavior.value?.closeModal?.()
  } catch (error: unknown) {
    console.error(error)
  }
}

/**
 * Remove itens da relacao to-many
 * Suporta remocao individual ou em lote
 */
const removeRows = async (id?: RowId) => {
  try {
    const isBatchAllowed = !!props.params?.config.removeBehavior?.batch
    const idsToDelete: RowId[] = isBatchAllowed
      ? selectedRows.value.map((r) => r.id).filter((v): v is RowId => v !== undefined)
      : id !== undefined
        ? [id]
        : []

    if (idsToDelete.length === 0) return

    if (isDraftMode.value) {
      dataToTable.value = dataToTable.value.filter((row) => {
        const rowId = row.id
        return rowId === undefined ? true : !idsToDelete.includes(rowId)
      })
      tableRef.value?.clearSelection?.()
      syncFieldValue(dataToTable.value)
      return
    }

    // Se for detach (remover da relacao sem deletar)
    if (props.params?.config.removeBehavior?.detach) {
      if (isBatchAllowed) {
        for (const itemId of idsToDelete) {
          await DynamicMethodsUtils.invoke(
            formSchema.value,
            props.params?.config.code,
            'remove',
            'FromMany',
            [parentId.value, props.params?.config.code, itemId],
            true
          )
        }
      } else {
        await DynamicMethodsUtils.invoke(
          formSchema.value,
          props.params?.config.code,
          'remove',
          'FromMany',
          [parentId.value, props.params?.config.code, idsToDelete[0]],
          true
        )
      }
    } else {
      const payload = isBatchAllowed ? idsToDelete : idsToDelete[0]
      await DynamicMethodsUtils.invoke(
        formSchema.value,
        props.params?.config.code,
        'delete',
        'Action',
        payload,
        true
      )
    }

    dataToTable.value = dataToTable.value.filter((row) => {
      const rowId = row.id
      return rowId === undefined ? true : !idsToDelete.includes(rowId)
    })
    tableRef.value?.clearSelection?.()
  } catch (error: unknown) {
    console.error(error)
  }
}

const updateBehaviorOpen = async (id: RowId) => {
  try {
    const values = await DynamicMethodsUtils.invoke(
      props.params?.config.formSchema ?? props.schema,
      props.params?.config.code,
      'get',
      'Values',
      id,
      true
    )

    initialValues.value = (values ?? null) as unknown as TableRow | null
    updateBehavior.value?.openModal?.()
  } catch (error: unknown) {
    console.error(error)
  }
}

/**
 * Adiciona itens existentes a relacao to-many
 */
const addItems = async (itemIds: RowId[], items: TableRow[] = []) => {
  if (!itemIds?.length) return

  if (isDraftMode.value) {
    const normalizedItems = items.map((item) => normalizeRow(item))
    const fallbackItems = itemIds
      .filter((itemId) => !normalizedItems.some((item) => item.id === itemId))
      .map((itemId) => ({ id: itemId }))

    dataToTable.value = uniqueRowsById([...dataToTable.value, ...normalizedItems, ...fallbackItems])
    syncFieldValue(dataToTable.value)
    addBehavior.value?.closeModal?.()
    return
  }

  try {
    await DynamicMethodsUtils.invoke(
      formSchema.value,
      'To',
      'add',
      'Many',
      [parentId.value, props.params?.config.code, itemIds],
      true
    )

    addBehavior.value?.closeModal?.()
    await loadData()
  } catch (error: unknown) {
    console.error(error)
  }
}

defineExpose({
  reload: loadData,
  getSelectedRows: () => selectedRows.value
})
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-slate-200 dark:border-navy-500">
    <!-- Actions Bar -->
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-navy-500 dark:bg-navy-750">
      <div class="flex flex-wrap items-center gap-2">
        <!-- Create Button -->
        <div v-if="params.config.createBehavior">
          <modal-base ref="baseModal" :confirm-callback="triggerFormSubmit">
            <template #trigger>
              <button
                class="btn h-8 w-8 rounded-full bg-primary p-0 font-medium text-white hover:bg-primary-focus focus:bg-primary-focus active:bg-primary-focus/90 dark:bg-accent dark:hover:bg-accent-focus dark:focus:bg-accent-focus dark:active:bg-accent/90"
              >
                <icon-plus class="h-4 w-4" />
              </button>
            </template>
            <template #content>
              <plugins-form-generator
                ref="formRef"
                :no-submit-button="true"
                :schema="params.config.formSchema ?? schema"
                context="create"
                @onSubmit="onSubmit"
              />
            </template>
          </modal-base>
        </div>

        <!-- Add Behavior Button -->
        <plugins-form-fields-relation-sub-add-behavior-list
          :id="parentId"
          ref="addBehavior"
          :code="params.config.code"
          :schema="params.config.formSchema ?? schema"
          @add-items="addItems"
        />

        <!-- Batch Remove Button -->
        <div v-if="params.config.removeBehavior && params.config.removeBehavior.batch">
          <button
            :disabled="selectedRows.length === 0"
            class="btn h-8 space-x-1.5 rounded-lg border border-error px-2.5 text-xs font-medium text-error hover:bg-error hover:text-white focus:bg-error focus:text-white active:bg-error/90 disabled:pointer-events-none disabled:opacity-40 dark:border-error dark:hover:bg-error dark:focus:bg-error"
            type="button"
            @click="removeRows()"
          >
            <icon-trash-lines class="h-4 w-4" />
            <span v-if="selectedRows.length > 0"> ({{ selectedRows.length }}) </span>
          </button>
        </div>

        <!-- Reload Button -->
        <button
          v-if="!isLoading"
          class="btn h-8 w-8 rounded-full p-0 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:text-navy-300 dark:hover:bg-navy-600 dark:hover:text-navy-100"
          type="button"
          @click="loadData"
        >
          <icon-refresh class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Base Table Component -->
    <plugins-form-fields-relation-sub-basetable
      ref="tableRef"
      :rows="dataToTable"
      :translation-prefix="params?.config.code ?? 'default'"
      :has-checkbox="hasCheckbox"
      :loading="isLoading"
      :show-actions="showActions"
      :sortable="true"
      @selection-change="onSelectionChange"
    >
      <!-- Actions Slot -->
      <template #actions="{ row }">
        <div class="flex items-center justify-center space-x-1.5">
          <button
            v-if="params.config.removeBehavior && !params.config.removeBehavior.batch"
            class="btn h-7 w-7 rounded-full p-0 text-error hover:bg-error/20 focus:bg-error/20 active:bg-error/25"
            @click.stop="removeRows(row.id)"
          >
            <icon-trash class="h-4 w-4" />
          </button>
          <button
            v-if="params.config.updateBehavior"
            class="btn h-7 w-7 rounded-full p-0 text-info hover:bg-info/20 focus:bg-info/20 active:bg-info/25"
            @click.stop.prevent="updateBehaviorOpen(row.id as RowId)"
          >
            <icon-edit class="h-4 w-4" />
          </button>
        </div>
      </template>
    </plugins-form-fields-relation-sub-basetable>
  </div>

  <!-- Update Modal -->
  <modal-base
    v-if="initialValues"
    ref="updateBehavior"
    :confirm-callback="updateTriggerFormSubmit"
    :no-button="true"
  >
    <template #content>
      <plugins-form-generator
        ref="formRef"
        :initial-values="initialValues"
        :no-submit-button="true"
        :schema="params.config.formSchema ?? schema"
        context="update"
        @onSubmit="onSubmitUpdate"
      />
    </template>
  </modal-base>
</template>

