<template>
  <div class="space-y-6">
    <!-- Lista de Categorias -->
    <div v-if="!selectedCategory" class="mb-4">
      <h4 class="text-lg font-semibold mb-2">Categorias</h4>
      <ul class="space-y-4">
        <li
            v-for="category in categories"
            :key="category.name"
            class="p-4 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200 transition duration-200"
            @click="selectCategory(category)"
        >
          <div class="flex justify-between items-center">
            <span class="font-medium">{{ category.name }}</span>
            <span class="text-sm text-gray-500">({{ category.widgets.length }} componentes)</span>
          </div>
        </li>
      </ul>
    </div>
    <div v-if="selectedCategory" class="bg-white dark:bg-navy-700 rounded-lg w-[80vw] max-w-4xl">
      <div class="flex my-2">
        <h3 class="text-xl font-semibold">Marketplace de Componentes</h3>
      </div>
      <div class="flex justify-between items-center mb-4 gap-2">

        <button class="btn shrink-0 rounded-none  px-3 py-2 font-medium" @click="selectedCategory = null">
          {{ t('commons.back') }}
        </button>
        <input
            v-model="searchQuery"
            class="form-input peer w-full rounded-lg bg-slate-150 px-3 py-2 pl-9 ring-primary/50 placeholder:text-slate-400 hover:bg-slate-200 focus:ring dark:bg-navy-900/90 dark:ring-accent/50 dark:placeholder:text-navy-300 dark:hover:bg-navy-900 dark:focus:bg-navy-900"
            placeholder="Buscar componentes..."
            type="text"
        />
      </div>

      <div class="flex">
        <!-- Lista de Componentes -->
        <div class="flex-shrink-0 w-1/3 pr-4">
          <div class="grid grid-cols-1 gap-4">
            <div
                v-for="component in selectedCategory.widgets"
                :key="component.id"
                class="cursor-pointer p-4 bg-gray-100 dark:bg-navy-600 rounded-md hover:bg-gray-200 transition duration-200"
                @click="selectWidget(component)"
            >
              <p class="mt-2 text-center">{{ t(component.name) }}</p>
            </div>
          </div>
        </div>

        <!-- Visualização do Componente -->
        <div class="flex-1 pl-4">
          <div v-if="selectedWidget" class="bg-gray-50 dark:bg-navy-600 p-4 rounded-md shadow-md">
            <div class="flex justify-between">
              <h4 class="text-xl font-semiboldmb-2">{{ selectedWidget.name }}</h4>
              <button class="btn h-8 w-8  p-0 hover:bg-slate-300/20 active:bg-slate-300/25 dark:hover:bg-navy-300/20 dark:active:bg-navy-300/25" @click="addToUser(selectedWidget)">
                <em class="fa-solid fa-circle-plus"></em>
              </button>
            </div>

            <widget-wrapper :is="markRaw(selectedWidget.component)" :configuration="mergeConfiguration(selectedWidget)"
                            :in-catalog="true" :initial-configuration="buildConfigurationValues(selectedWidget)"
                            :plugin-name="selectedWidget.name"
                            :widget-area-size="12"
                            widget-area-name="store"/>
          </div>
          <div v-else>Selecione um componente para visualizar.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, markRaw, ref} from 'vue'
import {usePluginManager} from "@/helpers/extensionLoader/usePluginManager.js";
import {useGlobalWidgetStore} from "@/stores/globalWidgetStore.js";
import type {WidgetBase} from "@/helpers/extensionLoader/WidgetBase.js";
import WidgetWrapper from "@/components/globalWidgets/WidgetWrapper.vue";
import {useI18n} from "vue-i18n";

const {t} = useI18n()
const widgetStore = useGlobalWidgetStore();
const {getGlobalWidgets, buildConfigurationValues, mergeConfiguration} = usePluginManager()

const props = defineProps<{ widgetArea: string }>()

const emit = defineEmits(['updateWidgetArea'])

// Dados fictícios para as categorias e widgets
const categories = computed(() => {
  const globalWidgets = getGlobalWidgets().value
  return globalWidgets.filter((item) => {
    return item.widgets.length > 0
  })

})

const selectedCategory = ref<null | any[]>(null)
const selectedWidget = ref(null)
const selectedConfig = ref({})

// Função para selecionar a categoria
const selectCategory = (category) => {
  selectedCategory.value = category
  selectedWidget.value = null // Resetar widget selecionado
}

// Função para selecionar o widget
const selectWidget = (widget) => {
  selectedWidget.value = widget
  // Resetar configurações selecionadas para o widget
  selectedConfig.value = {}
}

const addToUser = (widget: WidgetBase) => {
  widgetStore.addToWidgetArea(props.widgetArea, widget, buildConfigurationValues(widget)).then((response) => {
    emit("updateWidgetArea", response)
  })
}

</script>

<style scoped>
/* Adicione quaisquer estilos específicos se necessário */
</style>


<!--<script setup lang="ts">-->
<!--import CollapsibleItem from "@/components/collapes/collapsibleItem.vue";-->
<!--import {usePluginManager} from "@/helpers/extensionLoader/usePluginManager";-->
<!--import {markRaw} from "vue";-->
<!--import WidgetWrapper from "@/components/globalWidgets/WidgetWrapper.vue";-->
<!--import {WidgetBase} from "@/helpers/extensionLoader/WidgetBase";-->
<!--import {useGlobalWidgetStore} from "@/stores/globalWidgetStore";-->
<!--import { ref, computed } from 'vue'-->


<!--const searchQuery = ref('')-->
<!--const selectedComponent = ref(null)-->


<!--const props = defineProps<{ widgetArea: string }>()-->

<!--const emit = defineEmits(['updateWidgetArea'])-->

<!--const widgetStore = useGlobalWidgetStore();-->
<!--const {getGlobalWidgets, buildConfigurationValues, mergeConfiguration} = usePluginManager()-->


<!--// Computed para filtrar os componentes com base no nome-->
<!--const filteredComponents = computed(() => {-->
<!--  return filteredWidgets.value.filter(component =>-->
<!--      component.name.toLowerCase().includes(searchQuery.value.toLowerCase())-->
<!--  )-->
<!--})-->

<!--const selectComponent = (component) => {-->
<!--  selectedComponent.value = component-->
<!--}-->


<!--</script>-->

<!--<style scoped>-->
<!--/* Adicione quaisquer estilos personalizados necessários aqui */-->
<!--</style>-->

