import {onMounted, ref, type Ref} from 'vue'

export function useAsyncData<T>(fn: () => Promise<T>): {
    data: Ref<T | null>,
    error: Ref<Error | null>,
    isLoading: Ref<boolean>,
    refresh: () => Promise<T>
} {
    const data: Ref<T | null> = ref<T | null>(null) // <-- Tipagem explícita correta
    const error = ref<Error | null>(null)
    const isLoading = ref(true)

    async function fetchData() {
        isLoading.value = true
        try {
            data.value = await fn()
        } catch (err) {
            error.value = err as Error
        } finally {
            isLoading.value = false
        }
    }

    onMounted(fetchData)

    return {data, error, isLoading, refresh: fetchData}
}