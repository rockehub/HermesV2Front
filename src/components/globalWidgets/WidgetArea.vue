<template>
  <div v-auto-animate class="w-full p-2" @dblclick="toggleEdit">
    <!-- Toolbar -->
    <Transition name="fade">
      <div
        v-if="showEdit"
        class="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-navy-600 bg-slate-50 dark:bg-navy-800 px-3 py-2 mb-4"
      >
        <div class="flex gap-2">
          <button
            class="btn size-8 p-0 rounded-md text-primary hover:bg-primary/10"
            :title="t('widgets.add')"
            @click.prevent="openAddModal"
          >
            <em class="fa-solid fa-plus"></em>
          </button>

          <button
            v-if="widgets.length"
            class="btn size-8 p-0 rounded-md hover:bg-primary/10"
            :class="editing ? 'text-green-500' : 'text-primary'"
            :title="editing ? t('widgets.done') : t('widgets.edit')"
            @click.prevent="toggleEditing"
          >
            <em :class="editing ? 'fa-solid fa-check' : 'fa-solid fa-pen'"></em>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <span v-if="isSaving" class="text-xs text-slate-500">
            <em class="fa-solid fa-spinner fa-spin mr-1"></em>
            {{ t('widgets.saving') }}
          </span>
          <span class="text-xs text-slate-500 dark:text-navy-300">
            {{ widgets.length }} {{ t('widgets.widgets') }}
          </span>
        </div>
      </div>
    </Transition>

    <!-- Modal -->
    <ModalComponent :show="openModal" :panel="true" @update:show="openModal = $event">
      <GlobalWidgetWrapper
        :widget-area="name"
        @updateWidgetArea="onWidgetAdded"
        @close="openModal = false"
      />
    </ModalComponent>

    <!-- GRID COM TAMANHO RESTAURADO -->
    <draggable
      v-if="widgets.length"
      v-model="widgets"
      item-key="id"
      :disabled="!editing"
      class="grid grid-cols-12 gap-4"
      :options="{ group: 'widgets', animation: 200 }"
      @end="onDragEnd"
    >
      <template #item="{ element, index }">
        <div
          class="rounded-lg bg-white dark:bg-navy-700 shadow-sm transition"
          :class="[widgetSizeClass(element), editing ? 'hover:shadow-md cursor-move' : '']"
        >
          <WidgetWrapper
            :is="markRaw(element.widget.component)"
            :configuration="mergeConfiguration(element.widget)"
            :editing="editing"
            :initial-configuration="element.configuration"
            :pivot="element.pivot"
            :widget-id="element.id"
            :plugin-name="element.widget.name"
            :widget-area-name="name"
            :widget-area-size="size"
            :position="index"
            @update="onWidgetUpdated"
            @delete="onWidgetDeleted"
            @config-updated="onConfigUpdated"
          />
        </div>
      </template>
    </draggable>

    <!-- Empty -->
    <div
      v-else
      class="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-navy-600 p-8 text-center"
    >
      <em class="fa-solid fa-layer-group text-2xl text-slate-400"></em>
      <p class="text-sm text-slate-500">{{ t('widgets.add_some_widget') }}</p>
      <button
        class="text-primary dark:text-accent text-sm font-medium hover:underline"
        @click="openAddModal"
      >
        {{ t('widgets.click_to_add') }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { markRaw, onBeforeMount, ref, watchEffect } from 'vue'
import Draggable from 'vuedraggable'
import ModalComponent from '@/components/modal/ModalComponent.vue'
import GlobalWidgetWrapper from '@/components/globalWidgets/GlobalWidgetWrapper.vue'
import WidgetWrapper from '@/components/globalWidgets/WidgetWrapper.vue'
import { useGlobalWidgetStore } from '@/stores/globalWidgetStore'
import { usePluginManager } from '@/helpers/extensionLoader/usePluginManager'
import type { WidgetArea, WidgetReference } from '@/types/global.d'
import { vAutoAnimate } from '@formkit/auto-animate'
import { useI18n } from 'vue-i18n'

const { findWidgetByName, mergeConfiguration } = usePluginManager()
const widgetStore = useGlobalWidgetStore()
const { t } = useI18n()

const props = defineProps<{
  name: string
  size: number
}>()

const openModal = ref(false)
const data = ref<any | null>(null)
const widgets = ref<any[]>([])
const editing = ref(false)
const showEdit = ref(false)
const isSaving = ref(false)

onBeforeMount(async () => {
  data.value = await widgetStore.fetchUsersWidget(props.name)
})

watchEffect(() => {
  if (!data.value?.widgets) return

  widgets.value = data.value.widgets
    .map((item: WidgetReference) => ({
      id: item.id.widgetId,
      widget: findWidgetByName(item.widget.name),
      position: item.position,
      pivot: item.id.widgetAreaId,
      configuration: item.configurations
    }))
    .filter((w:any) => w.widget)
    .sort((a:any, b:any) => (a.position ?? 0) - (b.position ?? 0))
})

/**
 * ðŸ”‘ RESTAURA O CONTROLE DE TAMANHO DO WIDGET
 * configuration.size â†’ col-span-X
 */
const widgetSizeClass = (element: any) => {
  const size = Number(element.configuration?.size ?? 12)
  const clamped = Math.min(Math.max(size, 1), 12)

  return `col-span-${clamped}`
}

const toggleEdit = () => (showEdit.value = !showEdit.value)
const toggleEditing = () => (editing.value = !editing.value)
const openAddModal = () => (openModal.value = true)

const onWidgetAdded = (widgetData: any) => {
  data.value = widgetData
  openModal.value = false
}

const onWidgetUpdated = (widgetData: any) => {
  data.value = widgetData
}

const onWidgetDeleted = (widgetData: any) => {
  data.value = widgetData
}

const onConfigUpdated = (widgetData: any) => {
  data.value = widgetData
}

const onDragEnd = async ({ oldIndex, newIndex }: any) => {
  if (oldIndex === newIndex) return

  const widget = widgets.value[newIndex]
  if (!widget) return

  isSaving.value = true
  try {
    await widgetStore.updateWidgetPosition(widget.pivot, widget.id, newIndex + 1)
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

