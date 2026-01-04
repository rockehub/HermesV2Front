<template>
  <div>
    <VueLoading :active="isLoading"
             :is-full-page="true"/>


      <ItemsTable :diff-items="diffItems" :new-headers="newHeaders" :addToList="true" :updateUrl="updateItemsUrl" @addToList="afterAdd"/>

    <div class="card" v-if="loading">
      <div class="card-body">
        <div class="text-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    </div>
    <div class="card" v-else>
      <div class="card-body">
        <div class="col-12 m-2 gap-2 d-flex">
          <button class="btn btn-primary" type="button" @click="openModal" v-if="isAddScope">{{$t('app.addItems')}}</button>
          <button class="btn btn-danger" type="button" @click="remove" v-if="isRemoveScope">{{$t('app.removeItems')}}</button>
          <button class="btn-success btn" type="button" @click="create" v-if="isCreateScope">{{$t('app.create')}}</button>
        </div>
        <ItemsTable :diff-items="items" :new-headers="newHeaders" ref="principalList" />
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeMount } from "vue";
import "vue-loading-overlay/dist/css/index.css";
import { ErrorHandler } from "@/helpers/error/ErrorHandler";
import ItemsTable from "../fields/ItemsTable.vue";
import axios from "axios"; // Assuming axios is available globally or imported here

// Props definition
const props = defineProps<{
  headers: any[];
  getItemsUrl: string;
  updateItemsUrl: string;
  removeItemsUrl: string;
  scopes: any[];
}>();

const emit = defineEmits(['create']);

// Reactive state
const loading = ref(true);
const isLoading = ref(false);
const items = ref<any[]>([]);
const diffItems = ref<any[]>([]);
const newHeaders = ref<any[]>([]);

// Computed properties
const isAddScope = computed(() => (props.scopes as any).includes("add"));
const isRemoveScope = computed(() => (props.scopes as any).includes("remove"));
const isCreateScope = computed(() => (props.scopes as any).includes("create"));

// Fetch items method
const fetchItems = async () => {
  try {
    const response = await axios.get(props.getItemsUrl);
    items.value = response.data;
  } catch (error: any) {
    ErrorHandler.handle(error, "Erro ao buscar itens");
  }
};

// Fetch different items method
const fetchDiffItems = async () => {
  isLoading.value = true;
  const url = `${props.getItemsUrl}?all=true`;
  try {
    const response = await axios.get(url);
    diffItems.value = response.data;
  } catch (error: any) {
    ErrorHandler.handle(error, "Erro ao buscar itens");
  } finally {
    isLoading.value = false;
  }
};

// Methods
const create = () => {
  emit("create");
};

const remove = () => {
  isLoading.value = true;
  const itemsToRemove = (this.$refs.principalList as any).selected;
  if (itemsToRemove.length > 0) {
    const data = { items: itemsToRemove };
    axios
        .delete(props.removeItemsUrl, { data })
        .then(() => {
          fetchItems();
        })
        .catch((error: any) => {
          ErrorHandler.handle(error, "Erro ao remover itens");
        })
        .finally(() => {
          isLoading.value = false;
        });
  } else {
    isLoading.value = false;
  }
};

const afterAdd = () => {
  isLoading.value = true;
  fetchItems().then(() => {
    (this.$refs.modal as any).closeModal();
  }).finally(() => {
    isLoading.value = false;
  });
};

const openModal = () => {
  fetchDiffItems().then(() => {
    (this.$refs.modal as any).openModal();
  });
};

// Lifecycle hooks
onBeforeMount(() => {
  newHeaders.value = props.headers;
  // Check if headers need to be initialized with 'select'
  if (newHeaders.value.length === 0 || newHeaders.value[0].value !== "select") {
    newHeaders.value.unshift({ text: 'Select', value: 'select', sortable: false });
  }
});

onMounted(() => {
  fetchItems().finally(() => {
    loading.value = false;
  });
});
</script>