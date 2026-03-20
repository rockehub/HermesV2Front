<template>
  <div class="space-y-5">
    <template v-for="section in sections" :key="section.id">
      <div v-if="section.fields.length" class="space-y-4">
        <div>
          <h3 class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            {{ section.label }}
          </h3>
        </div>

        <div v-for="field in section.fields" :key="field.id">
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              {{ field.label }}
            </span>

            <input
              v-if="field.type === 'text' || field.type === 'number'"
              :value="fieldValue(field)"
              :type="field.type === 'number' ? 'number' : 'text'"
              class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100"
              @input="updateField(field.id, field.type === 'number' ? toNumber(($event.target as HTMLInputElement).value) : ($event.target as HTMLInputElement).value)"
            />

            <textarea
              v-else-if="field.type === 'textarea'"
              :value="fieldValue(field)"
              rows="4"
              class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100"
              @input="updateField(field.id, ($event.target as HTMLTextAreaElement).value)"
            ></textarea>

            <select
              v-else-if="field.type === 'select'"
              :value="fieldValue(field)"
              class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100"
              @change="updateField(field.id, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="option in field.options || []" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>

            <label
              v-else-if="field.type === 'boolean'"
              class="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-navy-600 dark:bg-navy-700/60"
            >
              <input
                :checked="Boolean(fieldValue(field))"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                @change="updateField(field.id, ($event.target as HTMLInputElement).checked)"
              />
              <span class="text-sm font-medium text-slate-700 dark:text-navy-100">
                {{ field.label }}
              </span>
            </label>

            <span v-if="field.description" class="mt-1.5 block text-xs text-slate-400 dark:text-navy-400">
              {{ field.description }}
            </span>
          </label>
        </div>
      </div>
    </template>

    <div
      v-if="!fields.length"
      class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 dark:border-navy-600 dark:bg-navy-700/30 dark:text-navy-400"
    >
      This widget has no configurable fields.
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, toRaw, watch } from 'vue'
import { getByPath, setByPath, type StorefrontWidgetField } from '../widgets/StorefrontWidgetBase'

const props = defineProps<{
  modelValue: Record<string, any>
  fields: StorefrontWidgetField[]
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: Record<string, any>): void
}>()

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(toRaw(value ?? ({} as T))))
}

const localValue = reactive<Record<string, any>>(deepClone(props.modelValue ?? {}))

watch(
  () => props.modelValue,
  (value) => {
    Object.keys(localValue).forEach((key) => delete localValue[key])
    Object.assign(localValue, deepClone(value ?? {}))
  },
  { deep: true }
)

const fields = computed(() => props.fields ?? [])
const sections = computed(() => {
  const order = [
    { id: 'content', label: 'Content' },
    { id: 'layout', label: 'Layout' },
    { id: 'style', label: 'Style' }
  ] as const

  return order.map((section) => ({
    ...section,
    fields: fields.value.filter((field) => (field.section ?? guessSection(field.id)) === section.id)
  }))
})

function guessSection(fieldId: string) {
  if (fieldId.startsWith('layout.')) return 'layout'
  if (fieldId.startsWith('style.')) return 'style'
  return 'content'
}

function fieldValue(field: StorefrontWidgetField) {
  const value = getByPath(localValue, field.id)
  return value ?? field.defaultValue ?? (field.type === 'boolean' ? false : '')
}

function toNumber(value: string) {
  if (value === '') return ''
  const parsed = Number(value)
  return Number.isNaN(parsed) ? '' : parsed
}

function updateField(key: string, value: any) {
  const next = deepClone(localValue)
  setByPath(next, key, value)
  Object.keys(localValue).forEach((currentKey) => delete localValue[currentKey])
  Object.assign(localValue, next)
  emit('update:modelValue', deepClone(next))
}
</script>
