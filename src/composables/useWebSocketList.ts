import {onMounted, onUnmounted, ref} from 'vue';
import {$socket} from "@/helpers/integration/websocket";

export function useWebSocketList<T extends { id: number }>(
    channel: string,
    eventPrefix: string
) {
    const list = ref<T[]>([]);


    const addItem = (item: T) => {
        if (!list.value.find(existing => existing.id === item.id)) {
            list.value.push(item);
        }
    };

    const updateItem = (item: T) => {
        const index = list.value.findIndex(existing => existing.id === item.id);
        if (index !== -1) {
            list.value[index] = item;
        }
    };

    const removeItem = (itemId: number) => {
        list.value = list.value.filter(existing => existing.id !== itemId);
    };

    const preloadItems = (items: T[]) => {
        list.value = items;
    };

    const listenToEvents = () => {
        $socket.private(channel)
            .listen(`.${eventPrefix}Created`, (event: { model: T }) => {
                console.log("creating", event)
                addItem(event.model);
            })
            .listen(`.${eventPrefix}Updated`, (event: { model: T }) => {
                console.log("updating", event)
                updateItem(event.model);
            })
            .listen(`.${eventPrefix}Deleted`, (event: { model: T }) => {
                console.log("deleting", event)
                removeItem(event.model.id);
            });
    };

    onMounted(() => {
        listenToEvents();
    });

    onUnmounted(() => {
        $socket.leave(channel);
    });

    return {
        list,
        preloadItems, // Permite setar os itens iniciais manualmente
    };
}
