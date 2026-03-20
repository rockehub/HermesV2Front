<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BaseFieldProps, SearchFieldSchema } from '@/classes/form/schemas'
import Popper from 'vue3-popper'
import { DynamicMethodsUtils } from '@/classes/form/DynamicMethodsUtils'
import vCurrency from '@/directives/currency'
import { onClickOutside } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import type { RegisteredField } from '@/classes/form/FieldRegistry'

const emit = defineEmits(['update:modelValue'])
const props = defineProps<BaseFieldProps<RegisteredField<'search'>>>()
const { t } = useI18n()

const value = ref('')
const searchResults = ref<
  {
    id: string
    name: string
    email: string
    [key: string]: string | number | null | undefined
  }[]
>([])
const selectedItem = ref<{ id: string; name: string } | null>(null)
const debounceTimeout = ref()
const isOpen = ref(false) // Track Popper visibility

// Close popper when clicking outside
const popperRef = ref(null)
onClickOutside(popperRef, () => {
  isOpen.value = false
})

watch(
  () => value.value,
  () => {
    if (value.value.length < 3 || selectedItem.value) return

    if (debounceTimeout.value) {
      clearTimeout(debounceTimeout.value)
    }

    debounceTimeout.value = setTimeout(() => {
      DynamicMethodsUtils.invoke(props.schema, props.params?.config.code, 'search', 'Action', value.value)
        .then((response: any) => {
          searchResults.value = response
          isOpen.value = response.length > 0 // Open popper only if there are results
        })
        .catch((error) => {
          console.error(error)
          searchResults.value = []
          isOpen.value = false
        })
    }, 500)
  }
)

type ExcludedKeyItem = {
  field: string
  title: string
}

const cols = computed(() => {
  if (!searchResults.value.length) return { filteredCols: [], htmlFields: [], currencyFields: [] }

  const firstRow = searchResults.value[0]
  const excludedKeys: {
    html: ExcludedKeyItem[]
    currency: ExcludedKeyItem[]
    others: ExcludedKeyItem[]
  } = {
    html: [],
    currency: [],
    others: []
  }

  Object.keys(firstRow).forEach((item) => {
    if (item.startsWith('currency_')) {
      excludedKeys.currency.push({
        field: item,
        title: t(`forms.field.${props.params?.config.code ?? 'default'}.${item}`)
      })
    } else if (item.startsWith('html_')) {
      excludedKeys.html.push({
        field: item,
        title: t(`forms.field.${props.params?.config.code ?? 'default'}.${item}`)
      })
    } else {
      excludedKeys.others.push({
        field: item,
        title: t(`forms.field.${props.params?.config.code ?? 'default'}.${item}`)
      })
    }
  })

  return {
    filteredCols: excludedKeys.others,
    htmlFields: excludedKeys.html,
    currencyFields: excludedKeys.currency
  }
})

const selectItem = (item: { id: string; name: string }) => {
  selectedItem.value = item
  value.value = item.name
  emit('update:modelValue', item.id)
  isOpen.value = false // Close the popper
}

const clearSelection = () => {
  selectedItem.value = null
  value.value = ''
  emit('update:modelValue', null)
}

const collectFieldValues = () => {
  if (selectedItem.value) return
  emit('update:modelValue', value.value)
}

watch(() => value.value, collectFieldValues, { deep: true, immediate: true })
</script>

<template>
  <div ref="popperRef" class="relative w-full">
    <!-- Input Field -->
    <div class="flex items-center">
      <input
        v-model="value"
        :disabled="!!selectedItem"
        type="text"
        :placeholder="t('form.commons.search')"
        class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        @focus="isOpen = searchResults.length > 0"
      />
      <button
        v-if="selectedItem"
        @click="clearSelection"
        class="btn ml-2 h-8 w-8 rounded-full p-0 text-slate-500 hover:bg-slate-300/20 hover:text-error focus:bg-slate-300/20 active:bg-slate-300/25 dark:hover:bg-navy-300/20 dark:focus:bg-navy-300/20"
      >
        ✖
      </button>
    </div>

    <!-- Popper for Search Results -->
    <Popper arrow :offsetDistance="'0'" :show="isOpen" class="flex w-full justify-center">
      <span></span>
      <template #content>
        <div
          class="p-3 rounded-lg border border-slate-150 bg-white shadow-soft dark:border-navy-600 dark:bg-navy-700 space-y-2 overflow-auto w-full max-h-60"
        >
          <!-- Header -->
          <div
            class="p-2 flex gap-3 items-center justify-between text-slate-600 font-medium rounded-lg dark:text-navy-100"
          >
            <span v-for="col in cols.filteredCols" :key="col.field">{{ t(col.title) }}</span>
            <span v-for="col in cols.htmlFields" :key="col.field">{{ t(col.title) }}</span>
            <span v-for="col in cols.currencyFields" :key="col.field">{{ t(col.title) }}</span>
          </div>

          <!-- Results -->
          <template v-for="(item, i) in searchResults" :key="i">
            <div
              @click="selectItem(item)"
              class="cursor-pointer p-2 flex gap-3 items-center justify-between text-slate-600 font-medium rounded-lg transition-all duration-300 hover:bg-slate-100 dark:text-navy-100 dark:hover:bg-navy-600"
            >
              <span v-for="col in cols.filteredCols" :key="col.field">{{ item?.[col.field] }}</span>
              <span
                v-for="col in cols.htmlFields"
                :key="col.field"
                v-html="item?.[col.field]"
              ></span>
              <span
                v-for="col in cols.currencyFields"
                :key="col.field"
                v-currency="item?.[col.field]"
              ></span>
            </div>
          </template>
        </div>
      </template>
    </Popper>
  </div>
</template>
