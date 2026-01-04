<script setup lang="ts">
import { ref, watch, onBeforeMount, defineEmits } from 'vue';
import axios from 'axios';
import {$axios} from "@/helpers/integration/integration";

const props = defineProps<{
  value?: string | null | number;
  params?: Record<string, string> | null;
  options: any[];
  asyncUrl?: string | null;
  dependsOnValue: any;
}>();

const emit = defineEmits<{
  (e: 'input', value: string | null): void;
}>();

const validOptions = ref<any[]>([]);
const selectedValue = ref<string | null>(props.value);

const updateValue = () => {
  emit('input', selectedValue.value); // Emit the change
};

const setOrFetch = () => {
  if (props.asyncUrl) {
    let url = props.asyncUrl;
    if (props.dependsOnValue) {
      // Add params and params values to URL, join params with &
      const paramsString = Object.keys(props.params || {}).map((key) => {
        return `${key}=${props.dependsOnValue}`;
      }).join('&');

      url = `${url}?${paramsString}`;
    }

    $axios.get(url).then((response: any) => {
      validOptions.value = response.data;
    });
  } else {
    validOptions.value = props.options;
  }
};

// Watchers
watch(() => props.value, (newVal) => {
  selectedValue.value = newVal; // Update local data when prop changes
});

watch(() => props.dependsOnValue, () => {
  setOrFetch();
});

// Lifecycle Hook
onBeforeMount(() => {
  setOrFetch();
});
</script>

<template>

  <select v-model="selectedValue" @change="updateValue"
          class="form-select w-full rounded-lg border  bg-transparent px-3 py-2 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent">
    <option value="" disabled selected>Não Selecionado</option>
    <option :value="option.id" v-for="(option, index) in validOptions" :key="'opt'+index">
      {{ option.name }}
    </option>
  </select>


</template>

<style scoped>

</style>