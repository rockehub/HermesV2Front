<script setup lang="ts">
import type { AbstractFormSchema } from '@/classes/form/AbstractFormSchema'
import { DynamicMethodsUtils } from '@/classes/form/DynamicMethodsUtils'
import { computed, ref } from 'vue'
import type { RegisteredField } from '@/classes/form/FieldRegistry'

type RowId = string | number
type TableRow = Record<string, unknown> & { id?: RowId }
type BaseTableRef = {
  getSelectedRows?: () => TableRow[]
  clearSelection?: () => void
  resetPagination?: () => void
}

const props = defineProps<{
  schema: AbstractFormSchema<RegisteredField<any>>
  code: string
  id?: any
}>()

const emit = defineEmits<{
  addItems: [itemIds: RowId[], items: TableRow[]]
}>()

const dataToTable = ref<TableRow[]>([])
const tableRef = ref<BaseTableRef | null>(null)
const baseModal = ref<{ openModal?: () => void; closeModal?: () => void } | null>(null)
const isLoading = ref(false)
const selectedRows = ref<TableRow[]>([])

const relationField = computed(() => props.schema?.getFieldByCode?.(props.code))
const relationResourcePath = computed(
  () => relationField.value?.config?.relation?.resourcePath || props.code.toLowerCase()
)

const normalizeRow = (row: unknown): TableRow => {
  if (!row || typeof row !== 'object') {
    return {}
  }

  const record = row as Record<string, unknown>
  const { _links, ...plainRow } = record as Record<string, unknown> & { _links?: unknown }
  return plainRow as TableRow
}

const onSelectionChange = (rows: TableRow[]) => {
  selectedRows.value = rows
}

const addItems = () => {
  const selectedItems = selectedRows.value.map((item) => normalizeRow(item))
  const itemIds = selectedItems
    .map((item) => item.id)
    .filter((id): id is RowId => id !== undefined)
  emit('addItems', itemIds, selectedItems)
}

defineExpose({
  closeModal: () => {
    baseModal.value?.closeModal?.()
  },
  openModal: () => {
    baseModal.value?.openModal?.()
  }
})

const fetchData = async () => {
  isLoading.value = true
  try {
    const response = await DynamicMethodsUtils.invoke(
      props.schema,
      'Entity',
      'list',
      'Items',
      relationResourcePath.value,
      true
    )
    dataToTable.value = Array.isArray(response)
      ? response.map((item: unknown) => normalizeRow(item))
      : []
    tableRef.value?.clearSelection?.()
  } catch (error) {
    console.error('Erro ao buscar itens:', error)
    dataToTable.value = []
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <modal-modal-base @afterEmit="fetchData" :confirm-callback="addItems" ref="baseModal" size="2xl">
    <template #trigger>
        <em class=" fa-solid fa-plus" />
    </template>
    <template #content>
      <plugins-form-fields-relation-sub-basetable
        ref="tableRef"
        :rows="dataToTable"
        :translation-prefix="code"
        :has-checkbox="true"
        :loading="isLoading"
        :sortable="true"
        :columns-limit="3"
        @selection-change="onSelectionChange"
      />
    </template>
  </modal-modal-base>
</template>
