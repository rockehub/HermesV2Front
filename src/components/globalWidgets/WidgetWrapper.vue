<template>
  <div
    v-if="canRender"
    class="relative rounded-lg"
    :class="editing ? 'ring-1 ring-primary/40' : ''"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
  >
    <!-- Componente do Widget -->
    <component
      :is="markRaw(is)"
      :initial-configuration="currentConfiguration"
      :pivot="pivot"
      :widget-id="widgetId"
      :is-catalog="inCatalog"
      :master-editing="editing"
    />

    <!-- Overlay de Ações -->
    <Transition name="fade">
      <div
        v-if="showActions && editing && !inCatalog"
        class="absolute top-2 right-2 flex gap-1 bg-white/90 dark:bg-navy-800/90 backdrop-blur rounded-md shadow px-1 py-1"
      >
        <button
          v-if="hasConfiguration"
          class="btn size-7 p-0 hover:text-primary"
          :title="t('widgets.configure')"
          @click="openConfigModal"
        >
          <em class="fa-solid fa-cog"></em>
        </button>

        <button
          class="btn size-7 p-0 text-error hover:text-error-focus"
          :title="t('widgets.delete')"
          @click="confirmDelete"
        >
          <em class="fa-solid fa-trash"></em>
        </button>
      </div>
    </Transition>

    <!-- Indicador de Salvando -->
    <Transition name="fade">
      <div
        v-if="isSaving"
        class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-navy-800/50 rounded-lg"
      >
        <em class="fa-solid fa-spinner fa-spin text-primary text-xl"></em>
      </div>
    </Transition>

    <!-- Modal de Configuração -->
    <ModalComponent :show="showConfigModal" @update:show="showConfigModal = $event">
      <div class="w-[500px] max-w-full">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">{{ t('widgets.configure') }} - {{ t(pluginName) }}</h3>
          <button class="btn size-8 p-0" @click="showConfigModal = false">
            <em class="fa-solid fa-times"></em>
          </button>
        </div>

        <plugins-form-generator
          ref="configFormRef"
          :schema="WidgetFormSchema.getInstance(filteredConfiguration, currentConfiguration)"
          :form-name="'widget.edit.configuration'"
          :provider="pluginName"
          :form-schema="filteredConfiguration"
          :initial-values="{ configuration: currentConfiguration }"
          :no-button="false"
          :submit-label="t('widgets.save')"
          translate-tag="widget"
          @onSubmit="onConfigSubmit"
        />
      </div>
    </ModalComponent>

    <!-- Modal de Confirmação de Delete -->
    <ModalComponent :show="showDeleteModal" @update:show="showDeleteModal = $event">
      <div class="w-[400px] max-w-full text-center">
        <em class="fa-solid fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></em>
        <h3 class="text-lg font-semibold mb-2">{{ t('widgets.confirm_delete') }}</h3>
        <p class="text-slate-500 mb-6">{{ t('widgets.delete_message') }}</p>

        <div class="flex gap-3 justify-center">
          <button
            class="btn px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-md"
            @click="showDeleteModal = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            class="btn px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-md"
            :disabled="isDeleting"
            @click="deleteWidget"
          >
            <em v-if="isDeleting" class="fa-solid fa-spinner fa-spin mr-1"></em>
            {{ t('widgets.delete') }}
          </button>
        </div>
      </div>
    </ModalComponent>
  </div>
</template>

<script setup lang="ts">
import { type Component, computed, ref } from 'vue'
import ModalComponent from '@/components/modal/ModalComponent.vue'
import { markRaw } from 'vue'
import { useGlobalWidgetStore } from '@/stores/globalWidgetStore'
import { WidgetFormSchema } from '@/classes/schemas/widget-form-schema'
import { useI18n } from 'vue-i18n'
import { hasRole } from '@/helpers/rbac/checks/hasRole'

const { t } = useI18n()
const widgetStore = useGlobalWidgetStore()

const props = defineProps<{
  is: Component
  inCatalog?: boolean
  pluginName: string
  editing?: boolean
  pivot?: string
  widgetId?: string
  widgetAreaName: string
  configuration: any[]
  initialConfiguration?: Record<string, any>
  widgetAreaSize: number
  position?: number
  requiredRoles?: string[]
}>()

const canRender = computed(() => hasRole(props.requiredRoles))

const emit = defineEmits(['update', 'delete', 'config-updated'])

const configFormRef = ref()
const showConfigModal = ref(false)
const showDeleteModal = ref(false)
const showActions = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const currentConfiguration = ref<Record<string, any>>({ ...props.initialConfiguration })

// Verifica se tem configurações
const hasConfiguration = computed(() => {
  return props.configuration && props.configuration.length > 0
})

// Filtra configurações baseado no tamanho da área
const filteredConfiguration = computed(() => {
  return props.configuration.map((config) => {
    if (config.name === 'size') {
      const filteredOptions = config.options.filter(
        (option: any) => option.id <= props.widgetAreaSize
      )
      return { ...config, options: filteredOptions }
    }
    return config
  })
})

// Abre modal de configuração
const openConfigModal = () => {
  showConfigModal.value = true
}

// Submit da configuração
const onConfigSubmit = async (form: any) => {
  if (!props.widgetId || !props.pivot) return

  const newConfig = form.toPlainObjectCode()
  isSaving.value = true

  try {
    const response = await widgetStore.updateWidgetConfiguration(
      props.pivot,
      props.widgetId,
      newConfig.configuration
    )
    currentConfiguration.value = newConfig
    showConfigModal.value = false
    emit('config-updated', response)
  } catch (error) {
    console.error('Erro ao salvar configuração:', error)
  } finally {
    isSaving.value = false
  }
}

// Confirma delete
const confirmDelete = () => {
  showDeleteModal.value = true
}

// Deleta widget
const deleteWidget = async () => {
  if (!props.widgetId || !props.pivot) return

  isDeleting.value = true
  try {
    const response = await widgetStore.deleteWidget(props.widgetId, props.pivot)
    showDeleteModal.value = false
    emit('delete', response)
  } catch (error) {
    console.error('Erro ao deletar widget:', error)
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
