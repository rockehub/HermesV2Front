import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'

export interface TenantData {
  id: string
  name: string
  slug: string | null
}

export const useTenantStore = defineStore('tenant', () => {
  const currentTenantId = useStorage<string | null>('tenantId', null)
  const availableTenants = useStorage<TenantData[]>('tenants', [])
  const pendingSelection = ref(false)
  const pendingEmployee = ref<{ accessToken: string; refreshToken: string; tenants: TenantData[] } | null>(null)

  const hasTenant = computed(() => !!currentTenantId.value)
  const isMultiTenant = computed(() => availableTenants.value.length > 1)
  const currentTenant = computed(() =>
    availableTenants.value.find(t => t.id === currentTenantId.value) ?? null
  )

  function setTenants(tenants: TenantData[], selectedId: string | null) {
    availableTenants.value = tenants
    currentTenantId.value = selectedId
  }

  function selectTenant(tenantId: string) {
    currentTenantId.value = tenantId
    pendingSelection.value = false
    pendingEmployee.value = null
  }

  function clearTenant() {
    currentTenantId.value = null
    availableTenants.value = []
    pendingSelection.value = false
    pendingEmployee.value = null
  }

  return {
    currentTenantId,
    availableTenants,
    pendingSelection,
    pendingEmployee,
    hasTenant,
    isMultiTenant,
    currentTenant,
    setTenants,
    selectTenant,
    clearTenant,
  }
})
