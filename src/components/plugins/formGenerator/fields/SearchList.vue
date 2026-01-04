<script setup lang="ts">
import {ref, computed, watch, onMounted, nextTick} from 'vue';
import TomSelect from "tom-select";
import {ListItemType} from "@/types/global";
import {$axios} from "@/helpers/integration/integration";

// Props definition
const props = defineProps<{
  url: string | null;
  params: Record<string, any> | null;
  initialValue: ListItemType | null | undefined;
}>();

const selectedValue = ref(props.initialValue);
const edit = ref(false);

// Computed properties
const urlWithParams = computed(() => {
  if (props.params) {
    let url = props.url;
    Object.keys(props.params).forEach((key) => {
      url = url?.replace(`:${key}`, props.params[key]);
    });
    return url;
  }
  return props.url;
});

const hasInitialValue = computed(() => !!props.initialValue);

// Watcher
watch(() => props.initialValue, (newVal) => {
  selectedValue.value = newVal;
});

const initializeTom = () => {
  new TomSelect('#search-list', {
    valueField: 'id',
    labelField: 'name',
    searchField: ['name'],
    maxItems: 30,
    load: (query: any, callback: any) => {
      $axios.get(urlWithParams.value + query).then((response: any) => {
        let data = response.data.result ?? response.data
        callback(data);
      }).catch(() => {
        callback();
      });
    },
    create: false,
    plugins: ['caret_position', 'input_autogrow', 'remove_button'],
  });
};

// Lifecycle hook
onMounted(() => {
  if (!hasInitialValue.value) {
    initializeTom();
  }
});
</script>


<template>

  <select
      v-model="selectedValue"
      id="search-list"
      class="mt-1.5 w-full"
      ref="input"
      :placeholder="$t('app.search')"
      type="text"
      v-if="!hasInitialValue  || edit"
  />


</template>

<style scoped>

</style>