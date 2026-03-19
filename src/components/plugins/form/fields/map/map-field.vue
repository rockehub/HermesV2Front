<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BaseFieldProps } from '@/classes/form/schemas'
import type { RegisteredField } from '@/classes/form/FieldRegistry'

const props = defineProps<BaseFieldProps<RegisteredField<'map'>>>()

type Row = { key: string; value: string }

const toRows = (obj: unknown): Row[] => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return []
  return Object.entries(obj as Record<string, unknown>).map(([k, v]) => ({
    key: k,
    value: String(v ?? '')
  }))
}

const rows = ref<Row[]>(toRows(props.initialValues?.[props.params.config.code]))

const emitChange = () => {
  const result: Record<string, string> = {}
  for (const row of rows.value) {
    if (row.key.trim()) {
      result[row.key.trim()] = row.value
    }
  }
  props.field?.onChange?.(result)
}

const addRow = () => {
  rows.value.push({ key: '', value: '' })
}

const removeRow = (index: number) => {
  rows.value.splice(index, 1)
  emitChange()
}

watch(
  () => props.initialValues?.[props.params.config.code],
  (val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      rows.value = toRows(val)
    }
  }
)
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-slate-200 dark:border-navy-500">
    <!-- Header -->
    <div class="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-navy-500 dark:bg-navy-750">
      <span class="w-2/5 text-xs font-medium text-slate-500 dark:text-navy-300">Chave</span>
      <span class="flex-1 text-xs font-medium text-slate-500 dark:text-navy-300">Valor</span>
      <span class="w-8"></span>
    </div>

    <!-- Rows -->
    <div class="divide-y divide-slate-100 dark:divide-navy-600">
      <div
        v-for="(row, i) in rows"
        :key="i"
        class="flex items-center gap-2 px-3 py-2"
      >
        <input
          v-model="row.key"
          placeholder="Chave"
          class="form-input w-2/5 rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
          @input="emitChange"
        />
        <input
          v-model="row.value"
          placeholder="Valor"
          class="form-input flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
          @input="emitChange"
        />
        <button
          type="button"
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-error/10 hover:text-error dark:text-navy-300 dark:hover:bg-error/20 dark:hover:text-error"
          @click="removeRow(i)"
        >
          <i class="fa-light fa-trash text-xs" />
        </button>
      </div>

      <div v-if="rows.length === 0" class="px-3 py-4 text-center text-xs text-slate-400 dark:text-navy-300">
        Nenhuma entrada ainda.
      </div>
    </div>

    <!-- Add Row Footer -->
    <div class="border-t border-slate-200 bg-slate-50 px-3 py-2 dark:border-navy-500 dark:bg-navy-750">
      <button
        type="button"
        class="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary dark:text-navy-300 dark:hover:text-accent"
        @click="addRow"
      >
        <i class="fa-light fa-plus text-xs" />
        Adicionar entrada
      </button>
    </div>
  </div>
</template>
