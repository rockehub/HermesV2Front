<!-- WidgetArea.vue -->
<template>
  <div class="">
    <span v-if="isCatalog"> area Widget</span>
    <div class="flex p-2" v-if="masterEditing"
         :class="{'justify-between': initialConfiguration.size <3 , 'justify-start': initialConfiguration.size >3}"
    >
      <button @click.prevent="addWidget"
              class="btn font-medium text-primary hover:bg-primary/20 focus:bg-primary/20 active:bg-primary/25 dark:text-accent-light dark:hover:bg-accent-light/20 dark:focus:bg-accent-light/20 dark:active:bg-accent-light/25"
      >
        <span class="fa-solid fa-circle-plus"></span>
      </button>
      <button
          @click.prevent="editing = !editing"
          class="btn font-medium text-primary hover:bg-primary/20 focus:bg-primary/20 active:bg-primary/25 dark:text-accent-light dark:hover:bg-accent-light/20 dark:focus:bg-accent-light/20 dark:active:bg-accent-light/25"
      >
        <em class="fa-solid fa-pen" v-if="!editing"></em>
        <em class="fa-solid fa-save" v-else></em>
      </button>
    </div>
    <ModalComponent :show="openModal" @update:show="openModal = $event">
      <GlobalWidgetWrapper :widget-area="initialConfiguration.name" @updateWidgetArea="updateAreaByResponse"/>
    </ModalComponent>
    <draggable
        v-model="widgets"
        item-key="id"
        :class="`widget-area widget-area-widget-${masterSize}`"
        :disabled="!editing"
        :options="{ group: 'widgets', animation: 200 }"
    >
      <template #item="{ element }">
        <div :class="`widget-${element.configuration.size}`">
          <widget-wrapper :is="markRaw(element.widget.component)" :in-catalog="!editing"
                          :plugin-name="element.widget.name"
                          :widget-area-size="initialConfiguration.size"
                          :editing="editing"
                          :pivot="element.pivot"
                          :id="element.id"
                          :widget-area-name="initialConfiguration.name"
                          :configuration="mergeConfiguration(element.widget)"
                          :initial-configuration="element.configuration"
                          @update="updateAreaByResponse"

          />
        </div>
      </template>
    </draggable>
  </div>
</template>

<script lang="ts" setup>
import {computed, markRaw, onBeforeMount, ref, watch, watchEffect} from 'vue';
import Draggable from 'vuedraggable';
import ModalComponent from "@/components/modal/ModalComponent.vue";
import GlobalWidgetWrapper from "@/components/globalWidgets/GlobalWidgetWrapper.vue";
import {useGlobalWidgetStore} from "@/stores/globalWidgetStore";
import type {WidgetArea, WidgetData} from "@/types/global";
import {usePluginManager} from "@/helpers/extensionLoader/usePluginManager";
import WidgetWrapper from "@/components/globalWidgets/WidgetWrapper.vue";

const {findWidgetByName, mergeConfiguration} = usePluginManager()
const widgetStore = useGlobalWidgetStore();
let openModal = ref<boolean>(false);
const data = ref<WidgetArea | null>(null)
const props = defineProps<{ initialConfiguration?: Record<string, any>, isCatalog: boolean, masterEditing: boolean }>()
const widgets = ref([])
const editing = ref(false);

if (!props.isCatalog) {
  onBeforeMount(async () => {
      widgetStore.fetchUsersWidget(props.initialConfiguration.name).then((response => {
       console.log(response)
       data.value = response
     }))

  })
}


const updateAreaByResponse = (widgetData: any) => {
  data.value = widgetData
}


watchEffect(() => {
  if (data.value?.widgets) {
    console.log("asdasdasdasd",data.value)
    widgets.value = data.value.widgets.map((item) => {
      console.log(item)
      return {
        id: item.id.widgetId,
        widget: findWidgetByName(item.widget.name),
        position: item.position,
        pivot: item.id.widgetAreaId,
        configuration: item.configurations,
      }
    }).filter(item=>{
      return item.widget != undefined
    });
  }
});


const updatePositions = (widgets: WidgetData[]) => {
  widgetStore.updatePositions(widgets, props.initialConfiguration.name);
}

watch(() => editing.value, (value) => {
  if (!value) {
    updatePositions(widgets.value)
  }
})


const addWidget = () => {
  openModal.value = true;
}

const masterSize = computed(() => {
  let realNumber = props.initialConfiguration.size < 0 ? 1 : props.initialConfiguration.size;
  realNumber = realNumber > 12 ? 12 : realNumber;
  return realNumber
})

</script>

<style scoped>
.widget-area {
  width: 100%;
  height: 100%;
  overflow: auto;
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
