// inactivityPlugin.ts

import {type App} from 'vue';
import {useAuthStore} from "@/stores/stores";
import {pinia} from "@/stores/main";
import notification from "@/helpers/utils/notification";


let inactivityTimer: string | number | NodeJS.Timeout | undefined;
let duration = 5000;

function resetTimer(): void {
    const authStore = useAuthStore(pinia);
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        if (authStore.getUser?.status && authStore.getUser?.status === "away") return
        authStore.changeStatus("away").then(() => {
            if (authStore.getUser?.status) {
                authStore.getUser.status = "away"
                console.info(new Date().toLocaleTimeString() + " - Você está inativo")
            }

            notification({text: "Você está inativo", variant: "warning"})
        })
    }, duration);
}

export function inactivityPlugin(app: App, options?: { duration?: number }): void {
    duration = options?.duration || 5000;

    const events: string[] = ['mousemove', 'mousedown', 'keypress', 'touchstart'];
    events.forEach(event => {
        window.addEventListener(event, resetTimer);
    });

    window.addEventListener('click', setUsersOnline)

    resetTimer();
}

function setUsersOnline(): void {
    const authStore = useAuthStore(pinia);
    if (authStore.getUser?.status && authStore.getUser?.status === "away") {
        authStore.changeStatus("online").then(() => {
            if (authStore.getUser?.status) {
                authStore.getUser.status = "online"
                console.info(new Date().toLocaleTimeString() + " - Você está online")
            }

            notification({text: "Você está Online", variant: "success"})
        })
    }
}