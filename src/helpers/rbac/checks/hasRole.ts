import { useAuthStore } from '@/stores/auth'

export const hasRole = (checkRoles?: string[]): boolean => {
  const authStore = useAuthStore()

  if (authStore.isAdmin) return true
  if (!checkRoles?.length) return true

  return checkRoles.some(r => authStore.roles.includes(r))
}
