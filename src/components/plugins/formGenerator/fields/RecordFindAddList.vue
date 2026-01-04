<template>
  <div class="pt-2" v-auto-animate>
    <button
        type="button"
        @click="showModal = true"
        class="btn h-9 w-9 rounded-full bg-primary p-0 font-medium text-white hover:bg-primary-focus focus:bg-primary-focus active:bg-primary-focus/90 dark:bg-accent dark:hover:bg-accent-focus dark:focus:bg-accent-focus dark:active:bg-accent/90"
    >
      <em class="material-icons">add</em>
    </button>
    <teleport to="body">
      <div
          class="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5"
          v-show="showModal"
          role="dialog"
          @keydown.esc="showModal = false"
      >
        <transition name="fade">
          <div
              class="absolute inset-0 bg-slate-900/60 backdrop-blur transition-opacity duration-300"
              @click="showModal = false"
              v-show="showModal"
          ></div>
        </transition>
        <transition name="fade">
          <div
              class="relative max-w-[80%]  rounded-lg bg-white px-4 py-10 text-center transition-opacity duration-300 dark:bg-navy-700 sm:px-5"
              v-show="showModal">

            <ListPage
                v-if="showModal"
                :starter-provider="starterProvider"
                :parent-provider="parentProvider"
                :parent-id="parentId"
                v-model="parentCheckedItems"
                :no-wrapper="true"
                :not-in="true"/>

            <div class="mt-4 flex justify-between">
              <button type="button"
                      @click="addRecords"
                      class="btn mt-6 bg-success font-medium text-white hover:bg-success-focus focus:bg-success-focus active:bg-success-focus/90"
              >
                {{ $t('app.add') }}
              </button>

              <button type="button"
                      @click="showModal = false"
                      class="btn mt-6 bg-error font-medium text-white hover:bg-success-focus focus:bg-success-focus active:bg-success-focus/90"
              >
                {{ $t('app.cancel') }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </teleport>
  </div>
</template>
<script setup lang="ts">
import {onMounted, ref} from "vue";
import ListPage from "../fields/ListPage.vue";
import { ErrorHandler } from "@/helpers/error/ErrorHandler";
import {$axios} from "@/helpers/integration/integration";

// Props definition
const props = defineProps<{
  showModalProp?: boolean;
  starterProvider?: string;
  parentProvider?: string;
  parentId?: string;
}>();

// Refs for reactive state
const showModal = ref(false);
const parentCheckedItems = ref<any[]>([]);

// Emit events
const emit = defineEmits(['added']);

// Methods
const addRecords = () => {
  if (!parentCheckedItems.value.length) {
    return ErrorHandler.handle(Error('No records selected')); // Replaced with a direct string since `this.$t` is not available.
  }

  $axios.post('data/associate', {
    parentProvider: props.parentProvider,
    parentId: props.parentId,
    starterProvider: props.starterProvider,
    records: parentCheckedItems.value,
  }).then(() => {
    showModal.value = false;
    emit('added');
  });
};

// Lifecycle Hook
onMounted(() => {
  console.info("starterProvider", props.starterProvider);
  console.info("parentProvider", props.parentProvider);
  console.info("parentId", props.parentId);
});
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

/* Estilização da Lista de Registros */


</style>