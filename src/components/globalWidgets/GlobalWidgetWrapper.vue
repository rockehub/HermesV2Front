<template>
  <div class="flex flex-col w-full max-h-[88vh]">
    <!-- Modal Header -->
    <div
      class="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-navy-600 bg-slate-50 dark:bg-navy-800 rounded-t-xl shrink-0"
    >
      <div class="flex items-center gap-2">
        <em class="fa-solid fa-cube text-primary text-sm"></em>
        <h3 class="font-semibold text-slate-700 dark:text-navy-100">{{ t('widgets.add') }}</h3>
      </div>
      <button
        class="btn size-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-navy-200 rounded-lg"
        @click="emit('close')"
      >
        <em class="fa-solid fa-times"></em>
      </button>
    </div>

    <!-- Body -->
    <div class="grid grid-cols-12 gap-0 flex-1 min-h-0 overflow-hidden">
      <!-- Categorias -->
      <aside
        class="col-span-3 border-r border-slate-200 dark:border-navy-600 overflow-y-auto py-3 px-2 space-y-1 bg-slate-50 dark:bg-navy-800"
      >
        <p
          class="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-navy-400 px-2 pb-1"
        >
          {{ t('widgets.categories') }}
        </p>
        <button
          v-for="category in categories"
          :key="category.name"
          class="w-full text-left rounded-lg px-3 py-2 text-sm transition"
          :class="[
            selectedCategory?.name === category.name
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-600 dark:text-navy-200 hover:bg-slate-200 dark:hover:bg-navy-700'
          ]"
          @click="selectCategory(category)"
        >
          {{ category.name }}
          <span class="text-xs opacity-60 ml-1">({{ category.widgets.length }})</span>
        </button>
      </aside>

      <!-- Lista de Widgets -->
      <section
        class="col-span-4 overflow-y-auto py-3 px-2 space-y-1 border-r border-slate-200 dark:border-navy-600"
      >
        <p
          class="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-navy-400 px-2 pb-1"
        >
          {{ selectedCategory?.name || t('widgets.widgets') }}
        </p>
        <div
          v-for="widget in selectedCategory?.widgets"
          :key="widget.id"
          class="rounded-lg border px-3 py-2.5 cursor-pointer transition"
          :class="[
            selectedWidget?.name === widget.name
              ? 'border-primary bg-primary/5 dark:bg-primary/10'
              : 'border-transparent hover:border-slate-200 dark:hover:border-navy-600 hover:bg-slate-50 dark:hover:bg-navy-800'
          ]"
          @click="selectWidget(widget)"
        >
          <div class="font-medium text-sm text-slate-700 dark:text-navy-100">
            {{ t(widget.name) }}
          </div>
          <div v-if="widget.description" class="text-xs text-slate-500 dark:text-navy-300 mt-0.5">
            {{ t(widget.description) }}
          </div>
        </div>
        <div
          v-if="!selectedCategory?.widgets?.length"
          class="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-navy-500"
        >
          <em class="fa-solid fa-box-open text-2xl mb-2"></em>
          <p class="text-xs">Nenhum widget nesta categoria</p>
        </div>
      </section>

      <!-- Preview e Configuração -->
      <section class="col-span-5 flex flex-col overflow-hidden">
        <div v-if="selectedWidget" class="flex flex-col h-full">
          <!-- Widget Header -->
          <div
            class="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-navy-600 shrink-0"
          >
            <div>
              <h4 class="font-semibold text-sm text-slate-700 dark:text-navy-100">
                {{ t(selectedWidget.name) }}
              </h4>
              <p
                v-if="selectedWidget.description"
                class="text-xs text-slate-500 dark:text-navy-300 mt-0.5"
              >
                {{ t(selectedWidget.description) }}
              </p>
            </div>
            <div class="flex gap-2">
              <button
                v-if="hasConfiguration"
                class="btn size-8 p-0 rounded-lg"
                :class="
                  showConfigForm
                    ? 'text-primary bg-primary/10'
                    : 'text-slate-500 hover:text-primary hover:bg-primary/10'
                "
                :title="t('widgets.initial_configuration')"
                @click="showConfigForm = !showConfigForm"
              >
                <em class="fa-solid fa-cog text-sm"></em>
              </button>
              <button
                class="btn flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-focus"
                :disabled="isAdding"
                @click="addWidgetToArea"
              >
                <em v-if="isAdding" class="fa-solid fa-spinner fa-spin text-xs"></em>
                <em v-else class="fa-solid fa-plus text-xs"></em>
                {{ t('widgets.add') }}
              </button>
            </div>
          </div>

          <!-- Overflow scroll area -->
          <div class="flex-1 overflow-y-auto">
            <!-- Formulário de Configuração Inicial -->
            <div
              v-if="showConfigForm && hasConfiguration"
              class="p-4 border-b border-slate-200 dark:border-navy-600 bg-slate-50 dark:bg-navy-800"
            >
              <p
                class="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-navy-400 mb-3"
              >
                {{ t('widgets.initial_configuration') }}
              </p>
              <plugins-form-generator
                ref="configFormRef"
                :schema="WidgetFormSchema.getInstance(widgetConfiguration)"
                :form-name="'widget.add.configuration'"
                :provider="selectedWidget.name"
                :form-schema="widgetConfiguration"
                :initial-values="configurationValues"
                :no-button="true"
                translate-tag="widget"
                @onSubmit="onConfigSubmit"
                @onChange="onConfigChange"
              />
            </div>

            <!-- Preview do Widget -->
            <div class="p-4">
              <p
                class="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-navy-400 mb-2"
              >
                {{ t('widgets.preview') }}
              </p>
              <div
                class="rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 overflow-hidden"
              >
                <widget-wrapper
                  :is="markRaw(selectedWidget.component)"
                  :configuration="mergeConfiguration(selectedWidget as any)"
                  :in-catalog="true"
                  :initial-configuration="configurationValues"
                  :plugin-name="selectedWidget.name"
                  :widget-area-size="12"
                  widget-area-name="catalog-preview"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center h-full gap-2 text-slate-400 dark:text-navy-500 p-8"
        >
          <em class="fa-solid fa-cube text-4xl"></em>
          <p class="text-sm font-medium">{{ t('widgets.select_to_preview') }}</p>
          <p class="text-xs text-center">Selecione uma categoria e um widget para visualizar</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, markRaw, onMounted, ref, watch } from 'vue'
import { usePluginManager } from '@/helpers/extensionLoader/usePluginManager.js'
import { useGlobalWidgetStore } from '@/stores/globalWidgetStore.js'
import type { WidgetBase } from '@/helpers/extensionLoader/WidgetBase.js'
import WidgetWrapper from '@/components/globalWidgets/WidgetWrapper.vue'
import { WidgetFormSchema } from '@/classes/schemas/widget-form-schema'
import { useI18n } from 'vue-i18n'
import type { ExtensionBase } from '@/helpers/extensionLoader/ExtensionBase'

const { t } = useI18n()
const widgetStore = useGlobalWidgetStore()
const { getGlobalWidgets, buildConfigurationValues, mergeConfiguration, isConfigurable } =
  usePluginManager()

const props = defineProps<{ widgetArea: string }>()
const emit = defineEmits(['updateWidgetArea', 'close'])

const configFormRef = ref()
const selectedCategory = ref<any>(null)
const selectedWidget = ref<WidgetBase | null>(null)
const configurationValues = ref<Record<string, any>>({})
const showConfigForm = ref(false)
const isAdding = ref(false)

// Categorias filtradas
type GlobalWidgetItem = {
  widgets: WidgetBase[]
  name: string
}

const categories = computed(() => {
  const items = getGlobalWidgets().value as unknown as GlobalWidgetItem[]
  return items.filter((item) => item.widgets.length > 0)
})

// Verifica se o widget tem configurações
const hasConfiguration = computed(() => {
  if (!selectedWidget.value) return false
  return isConfigurable(selectedWidget.value) && widgetConfiguration.value.length > 0
})

// Configurações do widget selecionado
const widgetConfiguration = computed(() => {
  if (!selectedWidget.value || !isConfigurable(selectedWidget.value)) return []
  return mergeConfiguration(selectedWidget.value as any)
})

// Seleciona categoria
const selectCategory = (category: any) => {
  selectedCategory.value = category
  selectedWidget.value = null
  configurationValues.value = {}
  showConfigForm.value = false
}

// Seleciona widget
const selectWidget = (widget: WidgetBase) => {
  selectedWidget.value = widget
  configurationValues.value = buildConfigurationValues(widget)
  showConfigForm.value = hasConfiguration.value
}

// Callback quando configuração muda
const onConfigChange = (formData: Record<string, any>) => {
  configurationValues.value = { ...configurationValues.value, ...formData }
}

// Callback do submit do form
const onConfigSubmit = (form: any) => {
  configurationValues.value = form.toPlainObjectCode()
}

// Adiciona widget à área
const addWidgetToArea = async () => {
  if (!selectedWidget.value) return

  isAdding.value = true
  try {
    const response = await widgetStore.addToWidgetArea(
      props.widgetArea,
      selectedWidget.value as any,
      configurationValues.value
    )
    emit('updateWidgetArea', response)
    emit('close')
  } catch (error) {
    console.error('Erro ao adicionar widget:', error)
  } finally {
    isAdding.value = false
  }
}

// Seleciona primeira categoria ao montar
onMounted(() => {
  if (categories.value.length > 0) {
    selectCategory(categories.value[0])
  }
})

// Reseta quando categoria muda
watch(selectedCategory, () => {
  selectedWidget.value = null
  configurationValues.value = {}
  showConfigForm.value = false
})
</script>
