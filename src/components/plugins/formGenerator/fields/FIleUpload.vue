<script setup lang="ts">
import { ref, computed } from "vue";
import FilePondComponent from "../fields/Filepond.vue";
import { FormSchemaField } from "../FormGenerator.vue";
import { Media } from "../types/form";

// Props
const props = defineProps<{
  id?: string;
  provider: string;
  mode?: string;
  uploadUrl: string;
  initialValues?: Record<string, any>;
  field: FormSchemaField;
}>();


const edit = ref<boolean>(false);

// Methods
function setEdit() {
  edit.value = true;
}

// Computed Properties
const initialFiles = computed<Media>(() => {
  return (props.initialValues?.[props.field.name] as Media) || {};
});

const hasInitialFiles = computed<boolean>(() => {
  return !!initialFiles.value.id;
});
</script>

<template>
  <div class="avatar mt-1.5 h-20 w-20 block" v-if="hasInitialFiles && !edit">
    <img class="mask is-squircle" :src="initialFiles.preview_url" alt="avatar">
    <div class="absolute bottom-0 right-0 flex items-center justify-center rounded-full bg-white dark:bg-navy-700">
      <button type="button" class="btn h-6 w-6 rounded-full border border-slate-200 p-0 hover:bg-slate-300/20 focus:bg-slate-300/20 active:bg-slate-300/25 dark:border-navy-500 dark:hover:bg-navy-300/20 dark:focus:bg-navy-300/20 dark:active:bg-navy-300/25">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" @click="setEdit">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
        </svg>
      </button>
    </div>
  </div>

  <FilePondComponent v-else :provider="this.provider" :field="this.field" :id='id' >

  </FilePondComponent>

</template>

<style scoped>

</style>