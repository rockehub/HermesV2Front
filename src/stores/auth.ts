import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
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
        // Multiple tenants — store pending state, do not commit token yet
        tenantStore.pendingSelection = true
        tenantStore.pendingEmployee = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          tenants: data.tenants ?? []
        }
        tenantStore.setTenants(data.tenants ?? [], null)
        return { requiresTenantSelection: true }
      }

      // Single tenant or no tenant — commit immediately
      token.value = data.accessToken
      tenantStore.setTenants(data.tenants ?? [], data.tenantId ?? null)

      const userData = await $axios.get('/api/v1/user')
      user.value = userData.data.data
      roles.value = userData.data.data.roles ?? []
      permissions.value = response.data.permissions ?? []

      return { requiresTenantSelection: false }
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        toast({ text: 'Erro de conexão com o servidor', variant: 'error' })
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
      // Exchange for a tenant-scoped token — use pending pre-auth token since token.value is not set yet
      const response = await $axios.post(
        '/api/v1/authentication/select-tenant',
        { tenantId },
        pendingToken ? { headers: { Authorization: `Bearer ${pendingToken}` } } : undefined
      )
      const data = response.data.data

      token.value = data.accessToken
      tenantStore.selectTenant(tenantId)

      const userData = await $axios.get('/api/v1/user')
      user.value = userData.data.data
      roles.value = userData.data.data.roles ?? []
    } catch (error: any) {
      error.response?.data?.errors?.forEach((err: any) => {
        toast({ text: err, variant: 'error' })
      })
      throw error
    }
  }

  async function logout() {
    try {
      // await $axios.post("/logout");
      clearAuth()
      toast({ text: 'Deslogado com sucesso', variant: 'success' })
    } catch {
      toast({ text: 'Erro ao deslogar', variant: 'error' })
    }
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
      await $axios.post('/forgotPassword', { email: credentials.username })
    } catch (error: any) {
      error.response?.data?.errors?.forEach((err: any) => {
        toast({ text: err, variant: 'error' })
      })
    }
  }

  async function resetPassword(credentials: ResetPassword) {
    try {
      await $axios.post('/resetPassword', {
        password: credentials.password,
        password_confirmation: credentials.password_confirmation,
        code: credentials.code
      })
      toast({ text: 'Senha alterada com sucesso', variant: 'success' })
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        toast({ text: 'Erro de conexão com o servidor', variant: 'error' })
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
