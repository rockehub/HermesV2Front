<template>
  <div :class="{'border-primary border-2 rounded-lg': editing}"
       @click="showConfigButton = !showConfigButton">
    <component :is="markRaw(is)" :initial-configuration="initialConfiguration" :is-catalog="inCatalog"
               :masterEditing="editing"/>
  </div>
  <div class="flex justify-between items-center p-2" v-if="showConfigButton && editing">
    <button @click="showConfig = !showConfig"
            class="btn -ml-1 size-6 rounded-full p-0 hover:bg-slate-300/20 focus:bg-slate-300/20 active:bg-slate-300/25 dark:hover:bg-navy-300/20 dark:focus:bg-navy-300/20 dark:active:bg-navy-300/25">
      <span class="fa-solid fa-cog"></span>
    </button>
    <button @click="deleteWidget"
            class="btn -ml-1 size-6 rounded-full p-0 hover:bg-slate-300/20 focus:bg-slate-300/20 active:bg-slate-300/25 dark:hover:bg-navy-300/20 dark:focus:bg-navy-300/20 dark:active:bg-navy-300/25">
      <span class="fa-solid fa-trash"></span>
    </button>

    <ModalComponent :show="showConfig" @update:show="showConfig != $event">
      <FormGenerator :form-name="$t('widget.configuration')" :provider="pluginName" :form-schema="filteredConfiguration"
                     :initial-values="initialConfiguration" @onSubmit="onSubmit" :no-button="true"
                     translate-tag="widget"/>
    </ModalComponent>
  </div>

</template>

<script setup lang="ts">
import {type Component, computed, ref} from "vue";
import ModalComponent from "@/components/modal/ModalComponent.vue";
import FormGenerator from "@/components/plugins/formGenerator/FormGenerator.vue";
import {markRaw} from 'vue';
import {useGlobalWidgetStore} from "@/stores/globalWidgetStore";

const widgetStore = useGlobalWidgetStore();
const showConfig = ref(false);
const showConfigButton = ref(false)
const props = defineProps<{
  is: Component,
  inCatalog?: boolean,
  pluginName: string,
  editing?: boolean,
  pivot?: string,
  id?: string,
  widgetAreaName: string
  configuration: any[],
  initialConfiguration?: Record<string, any>,
  widgetAreaSize: number
}>();

const emit = defineEmits(['update'])
const onSubmit = (form: any) => {
  console.info(form)
}

const deleteWidget = () => {
  widgetStore.deleteWidget(props.id,props.pivot).then((response) => {
    emit('update', response)
  })
}

const filteredConfiguration = computed(() => {
  return props.configuration.map((config) => {
    if (config.name === 'size') {
      const filteredOptions = config.options.filter((option: any) => option.id <= props.widgetAreaSize);
      return {
        ...config,
        options: filteredOptions,
      };
    }
    return config;
  });
});
</script>

<style scoped>

</style>