<template>
  <div id="app">
    <file-pond
        name="files"
        ref="pond"
        :server="{
  process: processFile,
}"
        class-name="my-pond"
        instant-upload="true"
        :label-idle="$t('app.dropFilesHere')"
        allow-multiple="false"
        accepted-file-types="image/jpeg, image/png"
        v-bind:files="myFiles"
    />
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import vueFilePond from 'vue-filepond';
import FilePondPluginFileValidateType
  from 'filepond-plugin-file-validate-type/dist/filepond-plugin-file-validate-type.esm.js';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.esm.js';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css';
import {FormSchemaField} from "../FormGenerator.vue";
import {$axios} from "@/helpers/integration/integration";

// Create FilePond component with plugins
const FilePond = vueFilePond(FilePondPluginFileValidateType, FilePondPluginImagePreview);


// Define props
const props = defineProps<{
  provider: string;
  id?: string;
  field: FormSchemaField;
}>();

// Create refs
const myFiles = ref<File[]>([]);
// Methods
// eslint-disable-next-line
async function processFile(fieldName: string, file: File, metadata: any, load: (fileId: any) => void, error: (message: string) => void, progress: (isActive: boolean, percentage: number, loaded: number, total: number) => void, abort: () => void) {
  try {
    const formData = new FormData();
    formData.append(fieldName, file, file.name);
    formData.append('provider', props.provider);
    formData.append('field', props.field.name);
    if (props.id) {
      formData.append('id', props.id);
    }

    const response = await $axios.post('data/upload', formData, {
      onUploadProgress: (progressEvent: ProgressEvent) => {
        const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        progress(true, percentage, progressEvent.loaded, progressEvent.total);
      },
    });

    const serverFileId = response.data;
    load(serverFileId);
  } catch (err) {
    error('oh no');
  }

  return {
    abort: () => {
      // Optionally handle abort
      abort();
    },
  };
}
</script>