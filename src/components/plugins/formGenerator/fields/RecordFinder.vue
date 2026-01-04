<template>
  <div class="is-scrollbar-hidden min-w-full overflow-x-auto">


    <ListPage :starter-provider="field.provider" :parent-id="parentId" :parent-provider="parentProvider"
              v-if="field.provider && loadedList" @loaded="alreadyLoaded = true"
              v-model="parentCheckedItems"
              :no-wrapper="true"
    >
      <template #listOptions>
        <div v-if="alreadyLoaded" v-auto-animate>
          <div class="flex gap-2">
            <RecordFindAddList @added="reloadList" v-model:show-modal-prop="showModal" :starter-provider="field.provider"
                               :parent-id="parentId" :parent-provider="parentProvider" v-if="field.provider"/>
            <div class="pt-2">
              <button
                  type="button"
                  @click="unassignRecords"
                  class="btn h-9 w-9 rounded-full bg-error p-0 font-medium text-white btn bg-error font-medium text-white hover:bg-error-focus focus:bg-error-focus active:bg-error-focus/90"
              >
                <em class="material-icons">remove</em>
              </button>
            </div>
          </div>
        </div>
      </template>
    </ListPage>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, nextTick} from "vue";
import ListPage from "../fields/ListPage.vue";
import { FormSchemaField } from "../FormGenerator.vue";
import { Cipher } from "@/helpers/utils/utils";
import RecordFindAddList from "../fields/RecordFindAddList.vue";
import { ErrorHandler } from "@/helpers/error/ErrorHandler";
import { useRoute } from "vue-router";
import {$axios} from "@/helpers/integration/integration";

// Props definition
const props = defineProps<{
  initialValue?: number;
  field: FormSchemaField;
}>();

// Refs for reactive state
const parentCheckedItems = ref<any[]>([]);
const showModal = ref(false);
const alreadyLoaded = ref(false);
const loadedList = ref(true);

// Route handling
const route = useRoute();

const parentProvider = computed(() => route.params.provider);
const parentId = computed(() => Cipher.decrypt(route.params.id as string));

// Methods
const unassignRecords = () => {
  if (!parentCheckedItems.value.length) {
    return ErrorHandler.handle(Error(route.meta.app.noRecordsSelected as string));
  }
  $axios.post('data/dissociate', {
    parentProvider: parentProvider.value,
    parentId: parentId.value,
    starterProvider: props.field.provider,
    records: parentCheckedItems.value
  }).then(() => {
    showModal.value = false;
    reloadList();
  });
};

const reloadList = () => {
  loadedList.value = false;
  alreadyLoaded.value = false;
  nextTick(() => {
    loadedList.value = true;
  });
};


</script>

<style scoped>
/* Estilos Personalizados */

/* Estilização do Campo de Entrada */
input[readonly] {
  cursor: pointer;
  background-color: #f8f9fa; /* Cor de fundo suave */
  border-color: #ced4da; /* Cor da borda */
}

/* Estilização do Modal */
.modal-custom {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 0.25rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  z-index: 1050;
  width: 80%;
  max-width: 800px; /* Largura máxima do modal */
}

.modal-content {
  overflow-y: auto;
  max-height: 400px; /* Altura máxima do conteúdo do modal */
}

/* Estilização da Lista de Registros */
.record-list-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.record-list-item:hover {
  background-color: #f8f9fa; /* Cor de fundo ao passar o mouse */
}


.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
