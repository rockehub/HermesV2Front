import {defineStore} from "pinia";
import {computed} from "vue";
import {StorageSerializers, useStorage} from "@vueuse/core";
import jwt_decode from "jwt-decode";
import {$axios} from "@/helpers/integration/integration";
import type {Credentials, ResetPassword, Token, User} from "@/helpers/interfaces/IAuth";
import notification from "@/helpers/utils/notification";
import {SynomSafeBox} from "@/helpers/utils/SynomSafeBox";

export const useAuthStore = defineStore("auth", () => {
    const token = useStorage<string | null>("token", null);
    const user = useStorage<User | null>("user", null, undefined, {serializer: StorageSerializers.object});
    const permissions = useStorage<string[]>("permissions", []);
    const toast = notification;

    const getToken = computed(() => token.value);
    const getUser = computed(() => user.value);
    const isAuthenticated = computed(() => !!token.value);

    async function changeStatus(status: string) {
        try {
            await $axios.post("/user/change-status", {status});
            toast({text: "Status alterado com sucesso", variant: "success"});
        } catch {
            toast({text: "Erro ao alterar status", variant: "error"});
        }
    }

    async function login(credentials: Credentials) {
        try {
            let publicKey;
            if (!(await SynomSafeBox.hasKey("privateKey"))) {
                publicKey = await SynomSafeBox.generateKeysForUser();
            } else {
                publicKey = JSON.parse(await SynomSafeBox.retrieveKey("publicKey"));
            }

            const response = await $axios.post("/login", {
                username: credentials.username,
                password: credentials.password,
                // publicKey,
            });


            token.value = response.data.access_token;

            const userData = await $axios.get("/api/v1/user");
            user.value = userData.data.data;
            permissions.value = response.data.permissions;
        } catch (error: any) {
            if (error.code === "ERR_NETWORK") {
                toast({text: "Erro de conexão com o servidor", variant: "error"});
            }
            error.response?.data?.errors?.forEach((err: any) => {
                toast({text: err, variant: "error"});
            });
            throw error;
        }
    }

    async function logout() {
        try {
            // await $axios.post("/logout");
            clearAuth();
            toast({text: "Deslogado com sucesso", variant: "success"});
        } catch {
            toast({text: "Erro ao deslogar", variant: "error"});
        }
    }

    function checkAuth() {
        if (token.value) {
            const decoded: Token = jwt_decode<Token>(token.value);
            if (decoded.exp < Date.now() / 1000) {
                clearAuth();
                return false;
            }
            return true;
        }
        return false;
    }

    async function forgotPassword(credentials: Credentials) {
        try {
            await $axios.post("/forgotPassword", {email: credentials.username});
        } catch (error: any) {
            error.response?.data?.errors?.forEach((err: any) => {
                toast({text: err, variant: "error"});
            });
        }
    }

    async function resetPassword(credentials: ResetPassword) {
        try {
            await $axios.post("/resetPassword", {
                password: credentials.password,
                password_confirmation: credentials.password_confirmation,
                code: credentials.code,
            });
            toast({text: "Senha alterada com sucesso", variant: "success"});
        } catch (error: any) {
            if (error.code === "ERR_NETWORK") {
                toast({text: "Erro de conexão com o servidor", variant: "error"});
            }
            error.response?.data?.errors?.forEach((err: any) => {
                toast({text: err, variant: "error"});
            });
        }
    }

    function clearAuth() {
        user.value = null;
        token.value = null;
        permissions.value = [];
    }

    return {
        token,
        user,
        permissions,
        getToken,
        getUser,
        isAuthenticated,
        changeStatus,
        login,
        logout,
        checkAuth,
        forgotPassword,
        resetPassword,
        clearAuth,
    };
});
