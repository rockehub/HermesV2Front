import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'

export function useAsyncData<T>(fn: () => Promise<T>): {
  data: Ref<T | null>
  error: Ref<Error | null>
  isLoading: Ref<boolean>
  refresh: () => Promise<void>
} {
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<Error | null>(null)
  const isLoading = ref(true)

  async function fetchData(): Promise<void> {
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

  return { data, error, isLoading, refresh: fetchData }
}
