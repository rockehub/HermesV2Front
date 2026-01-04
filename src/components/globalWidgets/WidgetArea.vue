<!-- WidgetArea.vue -->
<template>
  <div v-auto-animate class="" @dblclick="showEdit = !showEdit">
    <div :class="[{'justify-between': size <3 , 'justify-start': size >3}]" v-if="showEdit"
         class="flex p-2 "
    >
      <button
        class="btn font-medium text-primary hover:bg-primary/20 focus:bg-primary/20 active:bg-primary/25 dark:text-accent-light dark:hover:bg-accent-light/20 dark:focus:bg-accent-light/20 dark:active:bg-accent-light/25"
        @click.prevent="addWidget"
      >
        <span class="fa-solid fa-circle-plus"></span>
      </button>
      <button
        v-if="widgets.length > 0"
        class="btn font-medium text-primary hover:bg-primary/20 focus:bg-primary/20 active:bg-primary/25 dark:text-accent-light dark:hover:bg-accent-light/20 dark:focus:bg-accent-light/20 dark:active:bg-accent-light/25"
        @click.prevent="editing = !editing"
      >
        <em v-if="!editing" class="fa-solid fa-pen"></em>
        <em v-else class="fa-solid fa-save"></em>
      </button>
    </div>
    <ModalComponent :show="openModal" @update:show="openModal = $event">
      <GlobalWidgetWrapper :widget-area="name" @updateWidgetArea="updateAreaByResponse" />
    </ModalComponent>
    <draggable
      v-if="widgets.length > 0"
      v-model="widgets"
      v-auto-animate
      :class="[`widget-area widget-area-${masterSize}`, {'border border-primary dark:border-accent border-dashed': showEdit}]"
      :disabled="!editing"
      :options="{ group: 'widgets', animation: 200 }"
      item-key="id"
    >
      <template #item="{ element }">
        <div v-auto-animate :class="`widget-${element.configuration.size}`">
          <widget-wrapper :is="markRaw(element.widget.component)" :configuration="mergeConfiguration(element.widget)"
                          :editing="editing"
                          :initial-configuration="element.configuration"
                          :pivot="element.pivot"
                          :id="element.id"
                          :plugin-name="element.widget.name"
                          :widget-area-name="name"
                          :widget-area-size="size"
                          @update="updateAreaByResponse"
          />
        </div>
      </template>
    </draggable>
    <div v-else class="justify-center flex-wrap w-full p-4 flex gap-2">
      {{ t('widgets.add_some_widget') }} <button @click="addWidget" class="text-primary dark:text-accent">{{ t('widgets.click_to_add') }}</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, markRaw, onBeforeMount, ref, watch, watchEffect } from 'vue'
import Draggable from 'vuedraggable'
import ModalComponent from '@/components/modal/ModalComponent.vue'
import GlobalWidgetWrapper from '@/components/globalWidgets/GlobalWidgetWrapper.vue'
import { useGlobalWidgetStore } from '@/stores/globalWidgetStore'
import type { WidgetArea, WidgetData, WidgetReference } from '@/types/global'
import { usePluginManager } from '@/helpers/extensionLoader/usePluginManager'
import WidgetWrapper from '@/components/globalWidgets/WidgetWrapper.vue'
import { vAutoAnimate } from '@formkit/auto-animate'
import { useI18n } from 'vue-i18n'

const { findWidgetByName, mergeConfiguration } = usePluginManager()
const widgetStore = useGlobalWidgetStore()
let openModal = ref<boolean>(false)
const { t } = useI18n()
const data = ref<WidgetArea | null>(null)
const props = defineProps<{ initialWidgets: any[], name: string, size: number }>()
const widgets = ref([])
const editing = ref(false)
const showEdit = ref(false)
onBeforeMount(async () => {
  widgetStore.fetchUsersWidget(props.name).then((response => {
    data.value = response
  }))
})


watchEffect(() => {

  if (data.value?.widgets) {
    console.log('entered here now', data.value)
    widgets.value = data.value.widgets.map((item: WidgetReference) => ({
      id: item.id.widgetId,
      widget: findWidgetByName(item.widget.name),
      position: item.position,
      pivot: item.id.widgetAreaId,
      configuration: item.configurations
    })).filter(item => {
      return item.widget != undefined
    })
  }
})

const updateAreaByResponse = (widgetData: any) => {
  data.value = widgetData
}

const updatePositions = (widgets: WidgetData[]) => {
  widgetStore.updatePositions(widgets, props.name)
}

watch(() => editing.value, (value) => {
  if (!value) {
    updatePositions(widgets.value)
  }
})


const addWidget = () => {
  openModal.value = true
}

const masterSize = computed(() => {
  let realNumber = props.size < 0 ? 1 : props.size
  realNumber = realNumber > 12 ? 12 : realNumber
  return realNumber
})

</script>

<style scoped>
.widget-area {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 1rem;
}

.widget-grid {
  display: grid;
  gap: 1rem;
  width: 100%;
  height: 100%;
  padding: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* Responsive columns */
  grid-auto-rows: minmax(100px, auto); /* Responsive rows */
}

.widget-item {
  background: #f0f0f0;
  border: 1px solid #ddd;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  transition: all 0.2s ease;
}

.widget-item:active {
  cursor: grabbing;
  transform: scale(1.02); /* Visual feedback when dragging */
}

/* Media queries for different breakpoints */
@media (max-width: 768px) {
  .widget-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
}
</style>
