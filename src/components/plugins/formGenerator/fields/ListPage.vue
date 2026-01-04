<script setup lang="ts">
import { ref, computed, watch, onBeforeMount, nextTick } from 'vue';
import { useDataManagementStore } from "../store/dataManagementStore";
import Popper from "vue3-popper";
import GeneralSpinner from "@/components/generic/GeneralSpinner.vue";
import { Cipher } from "@/helpers/utils/utils";
import { debounce } from "vue-debounce";
import { ErrorHandler } from "@/helpers/error/ErrorHandler";
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";

// Props
const props = defineProps<{
  notIn?: boolean;
  starterProvider?: string | null;
  parentProvider?: string | null;
  parentId?: string | null;
  noWrapper?: boolean;
  routerEditName?: string;
}>();



// Store
const dataManagementStore = useDataManagementStore();

// Reactive Variables
const selectedItems = ref<any[]>([]);
const loading = ref(false);
const loadingNewProvider = ref(false);
const isInputActive = ref(false);
const searchText = ref('');
const page = ref(1);
const searchParam = ref('');
const perPage = ref(5);
const myDebounce = ref<any>(null);
const selectedColumns = ref<any[]>([]);
const metadata = ref<any>({});
const listData = ref<any>({});

// Computed Properties
const provider = computed(() => props.starterProvider || (useRoute().params.provider as string));

const listName = computed(() => `data.${provider.value}.list`);

const preferences = computed(() => currentListData.value.preferences?.available || {});
const currentListData = computed(() => listData.value || dataManagementStore.getListData);
const currentMetaData = computed(() => metadata.value || dataManagementStore.getListMetaData);

const hasPreviousPage = computed(() => currentListData.value.data.current_page !== 1);
const hasNextPage = computed(() => currentListData.value.data.current_page !== currentListData.value.data.last_page);
const lastPage = computed(() => currentListData.value.data.last_page || 0);
const currentPage = computed(() => currentListData.value.data.current_page);
const data = computed(() => currentListData.value.data.data);
const nextPossiblePagesIfCan = computed(() => {
  return [currentPage.value, currentPage.value + 1, currentPage.value + 2, currentPage.value + 3].filter((page) => page <= lastPage.value);
});
const {t}  = useI18n()

const emit = defineEmits(['loaded','update:modelValue'])
// Watchers
watch(selectedItems, () => {
  emit('update:modelValue', selectedItems.value);
});

watch(provider, () => {
  if (props.starterProvider) return;
  resetPagination();
  loadingNewProvider.value = true;
  fetchData().finally(() => {
    loadingNewProvider.value = false;
  });
});

watch(perPage, () => {
  page.value = 1;
  fetchData();
});

watch(page, fetchData);

// Methods
function trash(id: string) {
  dataManagementStore.trashMany(provider.value, [id]).then(fetchData);
}

function trashMany() {
  if (!selectedItems.value.length) return ErrorHandler.handle(Error(t('app.noRecordsSelected')));
  dataManagementStore.trashMany(provider.value, selectedItems.value).then(() => {
    selectedItems.value = [];
    fetchData();
  });
}

function isImage(field: string): boolean {
  return currentMetaData.value.find((meta: any) => meta.name === field)?.image || false;
}


function setPerPage(event: any) {
  perPage.value = event.target.value;
}

async function fetchData() {
  loading.value = true;
  try {
    const response = await dataManagementStore.fetchMetaData(provider.value, true);
    if (response) {
      metadata.value = response;
    }
    listData.value = await dataManagementStore.fetchListData({
      provider: provider.value,
      page: page.value,
      perPage: perPage.value,
      searchText: searchText.value,
      searchParam: searchParam.value,
      parentProvider: props.parentProvider,
      parentId: props.parentId,
      parentField: props.starterProvider,
      notIn: props.notIn,
    });
  } finally {
    loadPreferences();
    loading.value = false;
  }
}

function savePreferences() {
  dataManagementStore.savePreferences(provider.value, selectedColumns.value);
}

function toggleInput() {
  isInputActive.value = !isInputActive.value;
}

function loadPreferences() {
  const sessionPreferences = Object.keys(currentListData.value.preferences?.chosen || {});
  selectedColumns.value = sessionPreferences.length ? sessionPreferences : Object.keys(preferences.value);
  if (Object.keys(preferences.value).length && !searchParam.value) {
    searchParam.value = Object.keys(preferences.value)[0];
  }
}

function focusInput() {
  if (isInputActive.value) {
    nextTick(() => { /* Focus logic here if necessary */ });
  }
}

function resetPagination() {
  page.value = 1;
  perPage.value = 10;
  searchText.value = '';
  searchParam.value = '';
}

// Lifecycle Hooks
onBeforeMount(async () => {
  loadingNewProvider.value = true;
  try {
    const response = await dataManagementStore.fetchMetaData(provider.value, true);
    if (response) {
      metadata.value = response;
    }
    await fetchData();
  } finally {
    loadingNewProvider.value = false;
    setTimeout(() => {
      nextTick(() => emit('loaded'));
    }, 1000);
  }
});

myDebounce.value = debounce(fetchData, 1000);
</script>

<template>


  <div
      :class="{'scrollbar-sm': $breakpoints.smAndUp, 'mt-10 grow px-[calc(var(--margin-x)-.5rem)] py-5 transition-all duration-[.25s]':!noWrapper}"
      class="" v-auto-animate>
    <div v-if="!loadingNewProvider">
      <div class="flex items-center justify-between">
        <h2 class="line-clamp-1 text-base font-medium tracking-wide text-slate-700 dark:text-navy-100 flex p-2">
          <span v-if="!noWrapper" class="block m-2"> {{ $t(listName) }}</span>
          <div id="listOptions" class="flex gap-2">
            <slot name="listOptions"></slot>
            <div class="pt-2">
              <button
                  type="button"
                  @click="trashMany"
                  class="btn h-9 w-9 rounded-full bg-error p-0 font-medium text-white btn bg-error font-medium text-white hover:bg-error-focus focus:bg-error-focus active:bg-error-focus/90"
              >
                <em class="material-icons">delete</em>
              </button>
            </div>
          </div>

        </h2>
        <div class="flex">
          <div class="flex items-center">
            <label class="block">
              <select
                  v-model="searchParam"
                  class="form-select  w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs+ hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
              >
                <option v-for="(pref,index) in preferences" :key="pref.value" :value="index">{{ pref.label }}</option>
              </select>
            </label>

            <label class="block">
              <input
                  :class="isInputActive ? 'w-32 lg:w-48' : 'w-0'"
                  class="form-input bg-transparent px-1 text-center transition-all duration-100 placeholder:text-slate-500 dark:placeholder:text-navy-200"
                  placeholder="Search here..."
                  type="text"
                  v-model="searchText"
                  @focus="focusInput"
                  @input="myDebounce"
              >
            </label>
            <button @click="toggleInput" type="button"
                    class="btn h-8 w-8 rounded-full p-0 hover:bg-slate-300/20 focus:bg-slate-300/20 active:bg-slate-300/25 dark:hover:bg-navy-300/20 dark:focus:bg-navy-300/20 dark:active:bg-navy-300/25">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
          </div>
          <Popper class="flex" placement="bottom-end" offsetDistance="12">
            <button
                type="button"
                class="btn h-8 w-8 rounded-full p-0 hover:bg-slate-300/20 focus:bg-slate-300/20 active:bg-slate-300/25 dark:hover:bg-navy-300/20 dark:focus:bg-navy-300/20 dark:active:bg-navy-300/25">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
              </svg>
            </button>
            <template #content>
              <div
                  class="popper-box rounded-md border border-slate-150 bg-white py-1.5 font-inter dark:border-navy-500 dark:bg-navy-700">
                <div class="sidebar p-3">
                  <div v-for="(pref, key) in preferences" :key="key">
                    <label class="inline-flex items-center space-x-2" :for="key">
                      <input :id="key" :value="key" v-model="selectedColumns"
                             class="form-switch h-5 w-10 rounded-full bg-slate-300 before:rounded-full before:bg-slate-50 checked:bg-secondary checked:before:bg-white dark:bg-navy-900 dark:before:bg-navy-300 dark:checked:bg-secondary-light dark:checked:before:bg-white"
                             type="checkbox"
                      />
                      <span>{{ pref.label }}</span>
                    </label>
                  </div>
                  <button @click="savePreferences"
                          type="button"
                          class=" mt-3 btn bg-primary font-medium text-white hover:bg-primary-focus focus:bg-primary-focus active:bg-primary-focus/90 dark:bg-accent dark:hover:bg-accent-focus dark:focus:bg-accent-focus dark:active:bg-accent/90">
                    Save Preferences
                  </button>
                </div>
              </div>
            </template>
          </Popper>
        </div>
      </div>
      <div class="card mt-3">
        <div class="is-scrollbar-hidden min-w-full overflow-x-auto">
          <table class="is-hoverable w-full text-left">
            <!-- Table headers -->
            <thead>
            <tr>
              <th class="whitespace-nowrap bg-slate-200 px-4 py-3 font-semibold uppercase text-slate-800 dark:bg-navy-800 dark:text-navy-100 lg:px-5">
                {{ $t('app.select') }} ({{ selectedItems.length }})
              </th>
              <th v-for="col in selectedColumns" :key="col"
                  class="whitespace-nowrap bg-slate-200 px-4 py-3 font-semibold uppercase text-slate-800 dark:bg-navy-800 dark:text-navy-100 lg:px-5">
                {{ preferences[col].label }}
              </th>
              <th class="whitespace-nowrap bg-slate-200 px-4 py-3 font-semibold uppercase text-slate-800 dark:bg-navy-800 dark:text-navy-100 lg:px-5">
                {{ $t('app.actions') }}
              </th>
            </tr>
            </thead>
            <tbody v-auto-animate>
            <tr>
              <td></td>
            </tr>
            <tr v-for="item in data" :key="item.id"
                class="border-y border-transparent border-b-slate-200 dark:border-b-navy-500">
              <td class="whitespace-nowrap px-4 py-3 sm:px-5">
                <label class="inline-flex items-center space-x-2">
                  <input :value="item.id" v-model="selectedItems"
                         class="form-checkbox is-outline h-5 w-5 rounded border-slate-400/70 before:bg-primary checked:border-primary hover:border-primary focus:border-primary dark:border-navy-400 dark:before:bg-accent dark:checked:border-accent dark:hover:border-accent dark:focus:border-accent"
                         type="checkbox"
                  />
                </label>
              </td>


              <td class="whitespace-nowrap px-4 py-3 sm:px-5" v-for="col in selectedColumns" :key="col">
                <span v-if="!isImage(col)">
                     {{ item[col] }}
                </span>
                <div class="avatar flex h-10 w-10" v-else>
                  <img class="mask is-squircle" alt="avatar" :src="item[col]?.preview_url">
                </div>

              </td>

              <td class="whitespace-nowrap px-4 py-3 sm:px-5">
                <router-link
                    :to="{name: routerEditName, params: {provider: provider, id: Cipher.encrypt(item.id)}}"
                    class="btn h-9 w-9 p-0 font-medium text-primary hover:bg-primary/20 focus:bg-primary/20 active:bg-primary/25"
                >
                  <em class="material-icons"> contact_page</em>
                </router-link>
                <button
                    @click="trash(item.id)"
                    type="button"
                    class="btn h-9 w-9 p-0 font-medium text-error hover:bg-error/20 focus:bg-error/20 active:bg-error/25"
                >
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                  >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination and other controls -->
        <div class="flex flex-col justify-between space-y-4 px-4 py-4 sm:flex-row sm:items-center sm:space-y-0 sm:px-5">
          <div class="flex items-center space-x-2 text-xs+">
            <span>Show</span>
            <label class="block">
              <select
                  class="form-select rounded-full border border-slate-300 bg-white px-2 py-1 pr-6 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
                  v-on:change="setPerPage" v-model="perPage">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="30">30</option>
                <option value="50">50</option>
              </select>
            </label>
            <span>entries</span>
          </div>

          <ol class="pagination">
            <li class="rounded-l-lg bg-slate-150 dark:bg-navy-500" v-if="hasPreviousPage">
              <a href="#" v-on:click.prevent="page = 1"
                 class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-300 focus:bg-slate-300 active:bg-slate-300/80 dark:text-navy-200 dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90">
                <span class="material-icons"> first_page </span>
              </a>
            </li>
            <li class=" bg-slate-150 dark:bg-navy-500" v-if="hasPreviousPage">
              <a href="#" v-on:click.prevent="page--"
                 class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-300 focus:bg-slate-300 active:bg-slate-300/80 dark:text-navy-200 dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90">
                <span class="material-icons"> arrow_back_ios </span>
              </a>
            </li>
            <li class="bg-slate-150 dark:bg-navy-500" v-for="number in nextPossiblePagesIfCan" :key="number">
              <a href="#" v-on:click.prevent="page = number"
                 :class="{'bg-slate-300 dark:bg-navy-450': number === page}"
                 class="flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-3 leading-tight transition-colors hover:bg-slate-300 focus:bg-slate-300 active:bg-slate-300/80 dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90">{{
                  number
                }}</a>
            </li>
            <li class=" bg-slate-150 dark:bg-navy-500 " v-if="hasNextPage">
              <a href="#" v-on:click.prevent="page++"
                 class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-300 focus:bg-slate-300 active:bg-slate-300/80 dark:text-navy-200 dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90">
                <span class="material-icons"> arrow_forward_ios </span>
              </a>
            </li>
            <li class="rounded-r-lg bg-slate-150 dark:bg-navy-500" v-if="hasNextPage">
              <a href="#" v-on:click.prevent="page = lastPage"
                 class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-300 focus:bg-slate-300 active:bg-slate-300/80 dark:text-navy-200 dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90">
                <span class="material-icons"> last_page </span>
              </a>
            </li>
          </ol>

          <div class="text-xs+">
            <span>Showing </span>
            <span class="font-medium">{{ dataManagementStore.getListData?.data.from }}</span>
            <span> to </span>
            <span class="font-medium">{{ dataManagementStore.getListData?.data.to }}</span>
            <span> of </span>
            <span class="font-medium">{{ dataManagementStore.getListData?.data.total }}</span>
            <span> entries</span>
          </div>
        </div>
      </div>
    </div>
    <div class="p-4 sm:p-5" v-else>
      <GeneralSpinner/>
    </div>
  </div>


</template>

<style scoped>
w-0 {
  width: 0px !important;
}
</style>