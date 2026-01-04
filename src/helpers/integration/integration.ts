import axios, {type AxiosInstance, type AxiosRequestConfig, type AxiosResponse} from 'axios';
import { useAuthStore } from '@/stores/stores';
import router from '@/helpers/routes/main';
// import {$socket} from "@/helpers/integration/websocket";


let $axios: AxiosInstance;
export default {
    install: (app: any, config?: AxiosRequestConfig): void => {
        const baseUrl = import.meta.env.VITE_BFF_URL;

        const axiosInstance = axios.create({
            baseURL: `${baseUrl}`,
            headers: {
                'Cache-Control': 'no-cache',
            },
            ...config,
        });

        axiosInstance.interceptors.request.use(async (config: any) => {
            const auth= useAuthStore();
            if (auth.token) {
                config.headers.Authorization = `Bearer ${auth.token}`;
            }
            if (auth?.user?.tenantId){
                config.headers['X-Tenant-ID'] = auth.user.tenantId
            }

            return config;
        });

        axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => response,
            async (error: any) => {
                if (error.response?.status === 503) {
                    await router.push({name: 'maintenance'})
                }
                if (error.response?.status === 401) {
                    await router.push({name: 'login'})
                }
                return Promise.reject(error);
            }
        );

        $axios = axiosInstance;
        app.config.globalProperties.$axios = $axios;
    },
};

export {$axios};