import { ref } from 'vue'
import { $axios } from '@/helpers/integration/integration'
import notification from '@/helpers/utils/notification'

const toast = notification

export interface Role {
  id: string
  name: string
  description?: string
  pluginId?: string
  privileges?: Privilege[]
}

export interface Privilege {
  id: string
  name: string
}

export interface AdminEmployee {
  id: string
  name: string
  surname: string
  username: string
  email: string
  active: boolean
  roles: Role[]
}

export function useRbac() {
  const roles = ref<Role[]>([])
  const privileges = ref<Privilege[]>([])
  const employees = ref<AdminEmployee[]>([])
  const loading = ref(false)
  const totalEmployees = ref(0)

  async function fetchRoles() {
    loading.value = true
    try {
      const res = await $axios.get('/api/v1/admin/roles')
      roles.value = res.data.data
    } finally {
      loading.value = false
    }
  }

  async function fetchPrivileges() {
    loading.value = true
    try {
      const res = await $axios.get('/api/v1/admin/privileges')
      privileges.value = res.data.data
    } finally {
      loading.value = false
    }
  }

  async function fetchEmployees(page = 0, size = 20) {
    loading.value = true
    try {
      const res = await $axios.get('/api/v1/admin/employees', { params: { page, size } })
      employees.value = res.data.data.content
      totalEmployees.value = res.data.data.totalElements
    } finally {
      loading.value = false
    }
  }

  async function fetchEmployee(id: string): Promise<AdminEmployee> {
    const res = await $axios.get(`/api/v1/admin/employees/${id}`)
    return res.data.data
  }

  async function createRole(name: string, description: string) {
    const res = await $axios.post('/api/v1/admin/roles', { name, description })
    toast({ text: 'Role criada', variant: 'success' })
    return res.data.data as Role
  }

  async function updateRole(id: string, name: string, description: string) {
    const res = await $axios.patch(`/api/v1/admin/roles/${id}`, { name, description })
    toast({ text: 'Role atualizada', variant: 'success' })
    return res.data.data as Role
  }

  async function deleteRole(id: string) {
    await $axios.delete(`/api/v1/admin/roles/${id}`)
    toast({ text: 'Role removida', variant: 'success' })
  }

  async function createPrivilege(name: string) {
    const res = await $axios.post('/api/v1/admin/privileges', { name })
    toast({ text: 'Privilege criado', variant: 'success' })
    return res.data.data as Privilege
  }

  async function deletePrivilege(id: string) {
    await $axios.delete(`/api/v1/admin/privileges/${id}`)
    toast({ text: 'Privilege removido', variant: 'success' })
  }

  async function addPrivilegeToRole(roleId: string, privilegeId: string) {
    await $axios.post(`/api/v1/admin/roles/${roleId}/privileges`, { privilegeId })
    toast({ text: 'Privilege adicionado à role', variant: 'success' })
  }

  async function removePrivilegeFromRole(roleId: string, privilegeId: string) {
    await $axios.delete(`/api/v1/admin/roles/${roleId}/privileges/${privilegeId}`)
    toast({ text: 'Privilege removido da role', variant: 'success' })
  }

  async function assignRoles(employeeId: string, roleIds: string[]) {
    await $axios.patch(`/api/v1/admin/employees/${employeeId}/roles`, { roleIds })
    toast({ text: 'Roles atualizadas', variant: 'success' })
  }

  async function setEmployeeActive(employeeId: string, active: boolean) {
    await $axios.patch(`/api/v1/admin/employees/${employeeId}/active`, { active })
    toast({ text: active ? 'Employee ativado' : 'Employee desativado', variant: 'success' })
  }

  return {
    roles,
    privileges,
    employees,
    loading,
    totalEmployees,
    fetchRoles,
    fetchPrivileges,
    fetchEmployees,
    fetchEmployee,
    createRole,
    updateRole,
    deleteRole,
    createPrivilege,
    deletePrivilege,
    addPrivilegeToRole,
    removePrivilegeFromRole,
    assignRoles,
    setEmployeeActive,
  }
}
