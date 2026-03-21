import { defineStore } from 'pinia'
import { computed } from 'vue'
import { StorageSerializers, useStorage } from '@vueuse/core'
import jwt_decode from 'jwt-decode'
import { $axios } from '@/helpers/integration/integration'
import type { Credentials, ResetPassword, Token, User } from '@/helpers/interfaces/IAuth'
import { useTenantStore } from '@/stores/tenantStore'
import notification from '@/helpers/utils/notification'

export const useAuthStore = defineStore('auth', () => {
  const token = useStorage<string | null>('token', null)
  const user = useStorage<User | null>('user', null, undefined, {
    serializer: StorageSerializers.object
  })
  const permissions = useStorage<string[]>('permissions', [])
  const roles = useStorage<string[]>('userRoles', [])
  const toast = notification

  const getToken = computed(() => token.value)
  const getUser = computed(() => user.value)
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => roles.value.includes('ADMIN'))
  const isBillingOnly = computed(() => user.value?.tenantAccessStatus === 'BILLING_ONLY' || user.value?.tenantAccessStatus === 'BLOCKED')

  async function fetchUserProfile() {
    const response = await $axios.get('/api/v1/user')
    user.value = response.data.data
    roles.value = response.data.data.roles ?? []
    return response.data.data as User
  }

  async function changeStatus(status: string) {
    try {
      await $axios.post('/user/change-status', { status })
      toast({ text: 'Status alterado com sucesso', variant: 'success' })
    } catch {
      toast({ text: 'Erro ao alterar status', variant: 'error' })
    }
  }

  async function login(credentials: Credentials): Promise<{ requiresTenantSelection: boolean }> {
    try {
      const response = await $axios.post('/api/v1/authentication/login', {
        username: credentials.username,
        password: credentials.password
      })

      const data = response.data.data
      const tenantStore = useTenantStore()

      if (data.requiresTenantSelection) {
        tenantStore.pendingSelection = true
        tenantStore.pendingEmployee = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          tenants: data.tenants ?? []
        }
        tenantStore.setTenants(data.tenants ?? [], null)
        return { requiresTenantSelection: true }
      }

      token.value = data.accessToken
      tenantStore.setTenants(data.tenants ?? [], data.tenantId ?? null)
      await fetchUserProfile()
      permissions.value = response.data.permissions ?? []
      return { requiresTenantSelection: false }
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        toast({ text: 'Erro de conexao com o servidor', variant: 'error' })
      }
      error.response?.data?.errors?.forEach((err: any) => {
        toast({ text: err, variant: 'error' })
      })
      throw error
    }
  }

  async function selectTenant(tenantId: string) {
    const tenantStore = useTenantStore()
    try {
      const pendingToken = tenantStore.pendingEmployee?.accessToken
      const response = await $axios.post(
        '/api/v1/authentication/select-tenant',
        { tenantId },
        pendingToken ? { headers: { Authorization: `Bearer ${pendingToken}` } } : undefined
      )
      const data = response.data.data
      token.value = data.accessToken
      tenantStore.selectTenant(tenantId)
      await fetchUserProfile()
    } catch (error: any) {
      error.response?.data?.errors?.forEach((err: any) => {
        toast({ text: err, variant: 'error' })
      })
      throw error
    }
  }

  async function logout() {
    clearAuth()
    toast({ text: 'Deslogado com sucesso', variant: 'success' })
  }

  function checkAuth() {
    if (token.value) {
      const decoded: Token = jwt_decode<Token>(token.value)
      if (decoded.exp < Date.now() / 1000) {
        clearAuth()
        return false
      }
      return true
    }
    return false
  }

  async function forgotPassword(credentials: Credentials) {
    try {
      await $axios.get(`/api/v1/authentication/password/change/${credentials.username}`)
      toast({ text: 'Solicitacao enviada', variant: 'success' })
    } catch (error: any) {
      error.response?.data?.errors?.forEach((err: any) => {
        toast({ text: err, variant: 'error' })
      })
    }
  }

  async function resetPassword(credentials: ResetPassword) {
    try {
      await $axios.post(`/api/v1/authentication/password/change/${credentials.code}`, {
        newPassword: credentials.password,
        matchingPassword: credentials.password_confirmation
      })
      toast({ text: 'Senha alterada com sucesso', variant: 'success' })
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        toast({ text: 'Erro de conexao com o servidor', variant: 'error' })
      }
      error.response?.data?.errors?.forEach((err: any) => {
        toast({ text: err, variant: 'error' })
      })
    }
  }

  function clearAuth() {
    user.value = null
    token.value = null
    permissions.value = []
    roles.value = []
    useTenantStore().clearTenant()
  }

  return {
    token,
    user,
    permissions,
    roles,
    getToken,
    getUser,
    isAuthenticated,
    isAdmin,
    isBillingOnly,
    fetchUserProfile,
    changeStatus,
    login,
    selectTenant,
    logout,
    checkAuth,
    forgotPassword,
    resetPassword,
    clearAuth
  }
})
