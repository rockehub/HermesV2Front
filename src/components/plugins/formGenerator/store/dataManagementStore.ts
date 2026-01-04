import {defineStore} from "pinia";
import type {DataManagement, DataManagementListData, DataManagementState} from "../types/form.d";
import {useStorage} from "@vueuse/core";
import {$axios} from "@/helpers/integration/integration";
import {ErrorHandler} from "@/helpers/error/ErrorHandler";
import notification from "@/helpers/utils/notification";


export const useDataManagementStore = defineStore({
    id: 'dataManagement',
    state: (): DataManagementState => ({
        availableDataManagement: useStorage('availableDataManagement', []),
        loading: false,
        metaData: [],
        listData: null,
        listMetaData: []
    }),
    getters: {
        getAvailableDataManagement(): DataManagement[] {
            return this.availableDataManagement
        },
        isLoading(): boolean {
            return this.loading
        },
        getMetaData(): any {
            return this.metaData
        },
        getListMetaData(): any {
            return this.listMetaData
        },
        getListData(): DataManagementListData | null {
            return this.listData
        }
    },
    actions: {
        async create(provider: string, data: any) {
            return $axios.post(`data/${provider}/create`, data).then(response => {
                return response.data
            }).catch(error => {
                ErrorHandler.handle(error, error.response.data.message)
                return null
            })
        },
        async update(provider: string, data: any, id: string) {
            try {
                const response = await $axios.put(`data/${provider}/update/${id}`, data);
                notification({text: response.data.message, variant: "success"});
            } catch (error: any) {
                ErrorHandler.handle(error, error.response.data.message);
            }
        },
        async fetchAvailableDataManagement() {
            this.loading = true
            return $axios.get('data/providers').then(response => {
                const result = Object.values(response.data)
                this.availableDataManagement = result as DataManagement[]
            }).catch(error => {
                ErrorHandler.handle(error, error.response.data.message)
            }).finally(() => {
                this.loading = false
            })

        },
        async fetchMetaData(provider: string, list: boolean = false, noCache: boolean = false) {
            return $axios.get(`data/${provider}/metadata`).then(response => {
                if (!noCache) {
                    if (!list) {
                        this.metaData = Object.values(response.data)
                    } else {
                        this.listMetaData = Object.values(response.data)
                    }
                }
                return Object.values(response.data)
            }).catch(error => {
                ErrorHandler.handle(error, error.response.data.message)
            })
        },
        async fetchData(provider: string, id: string) {
            return $axios.get(`data/${provider}/fetch/${id}`).then(response => {
                return response.data
            }).catch(error => {
                ErrorHandler.handle(error, error.response.data.message)
            })
        },
        async fetchListData({
                                provider,
                                page = 1,
                                perPage = 10,
                                searchText = null,
                                searchParam = null,
                                parentProvider = null,
                                parentField = null,
                                parentId = null,
                                notIn = false,
                            }: {
            provider: string,
            page?: number,
            perPage?: number,
            searchText?: string | null,
            searchParam?: string | null,
            parentProvider?: string | null,
            parentField?: string | null,
            parentId?: string | null
            notIn?: boolean
        }, noCache: boolean = false) {
            const url = `data/${provider}/fetch`;

            const params = {
                provider,
                page,
                perPage,
                searchText,
                searchParam,
                parentProvider,
                parentField,
                parentId,
                notIn
            };

            try {
                const response = await $axios.get(url, {params});
                if (!noCache) {
                    this.listData = response.data;
                }
                return response.data;
            } catch (error: any) {
                ErrorHandler.handle(error, error.response?.data.message);
            }
        },
        async savePreferences(provider: string, data: any) {
            try {
                const response = await $axios.post(`data/${provider}/preferences`, data);
                notification({text: response.data.message, variant: "success"});
            } catch (error: any) {
                ErrorHandler.handle(error, error.response.data.message);
            }
        },
        loadPreferences(provider: string) {
            return JSON.parse(localStorage.getItem(`preferences_${provider}`) || '[]')
        },
        async trashMany(provider: string, data: any) {
            return $axios.delete(`data/${provider}/delete`, {data:{records:data}}).then(response => {
                return response.data
            }).catch(error => {
                ErrorHandler.handle(error, error.response.data.message)
            })
        }
    }
})