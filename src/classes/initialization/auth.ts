import {useAuthStore} from "@/stores/stores";
import {pluginsLoaded, runWhenAuthenticated, runWhenUnauthenticated} from "@/helpers/extensionLoader/extension-loader";
import {watch} from "vue";

export default {
    install: async () => {

        console.log("Waiting for plugins to load...");

        while (!pluginsLoaded.value) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        console.log("Plugins loaded. Starting authentication events...");

        const authStore = useAuthStore();
        watch(()=> authStore.isAuthenticated, async () => {
            console.log("runned this shit")
            if (authStore.isAuthenticated) {
                console.log("runned this shit when authenticated")
                await runWhenAuthenticated()
            } else {
                console.log("runned this shit when unauthenticated")
                await runWhenUnauthenticated()
            }
        }, {immediate: true, deep: true})

    },
};