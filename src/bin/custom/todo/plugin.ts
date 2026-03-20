import {ExtensionBase} from "@/helpers/extensionLoader/ExtensionBase";
import TodoPage from "./pages/TodoPage.vue"
import { type App, ref, type Ref } from 'vue'
import type {MenuItem} from "@/types/global.d";

export default class todoPlugin extends ExtensionBase {
    name = 'todo';
    component = TodoPage
    routes = [
        {
            name: 'todo',
            path: '/todo',
            component: TodoPage
        }
    ];
    menuItem: Ref<MenuItem[]> = ref([{
        name: 'todo',
            icon: {
                icon: 'fa-light fa-tasks text-[1.2rem]',
                type: 'fa'
            },
        label: 'Todo'
    }]);

    async boot(): Promise<void> {
        console.info('todo plugin booted');
    }

    async register(app: App): Promise<void> {
        console.info('todo plugin registered');
    }
}
