<template>
  <DefaultLayout
    :icon="{ type: 'fa', icon: 'fa-light fa-diagram-project text-[1.2rem]' }"
    :menu-items="[]"
  >
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-slate-800 dark:text-navy-100">
            Roles & Privileges
          </h1>
          <p class="text-sm text-slate-500 dark:text-navy-400 mt-1">
            Gerencie roles e seus privileges
          </p>
        </div>
        <button
          class="btn px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-focus flex items-center gap-2"
          @click="openCreateRole"
        >
          <em class="fa-solid fa-plus text-sm"></em>
          Nova Role
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Roles list -->
        <div class="card overflow-hidden">
          <div
            class="px-4 py-3 border-b border-slate-100 dark:border-navy-700 font-semibold text-slate-700 dark:text-navy-100"
          >
            Roles
          </div>

          <div v-if="loading" class="flex justify-center py-8">
            <em class="fa-solid fa-spinner fa-spin text-primary"></em>
          </div>

          <div v-else class="divide-y divide-slate-100 dark:divide-navy-700">
            <div
              v-for="role in roles"
              :key="role.id"
              class="px-4 py-3 hover:bg-slate-50 dark:hover:bg-navy-750 cursor-pointer transition"
              :class="selectedRole?.id === role.id ? 'bg-primary/5 dark:bg-primary/10' : ''"
              @click="selectRole(role)"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-sm text-slate-700 dark:text-navy-100">{{
                      role.name
                    }}</span>
                    <span
                      v-if="role.pluginId"
                      class="px-1.5 py-0.5 rounded text-xs bg-info/10 text-info"
                    >
                      {{ role.pluginId }}
                    </span>
                  </div>
                  <p
                    v-if="role.description"
                    class="text-xs text-slate-400 dark:text-navy-400 mt-0.5 truncate"
                  >
                    {{ role.description }}
                  </p>
                </div>
                <div class="flex gap-1 ml-2 shrink-0">
                  <button
                    class="btn size-7 p-0 text-primary hover:bg-primary/10 rounded"
                    title="Editar"
                    @click.stop="openEditRole(role)"
                  >
                    <em class="fa-solid fa-pen text-xs"></em>
                  </button>
                  <button
                    class="btn size-7 p-0 text-error hover:bg-error/10 rounded"
                    title="Excluir"
                    @click.stop="confirmDeleteRole(role)"
                  >
                    <em class="fa-solid fa-trash text-xs"></em>
                  </button>
                </div>
              </div>
            </div>

            <div
              v-if="!roles.length"
              class="px-4 py-8 text-center text-slate-400 dark:text-navy-500 text-sm"
            >
              Nenhuma role criada
            </div>
          </div>
        </div>

        <!-- Privileges panel -->
        <div class="card overflow-hidden">
          <div
            class="px-4 py-3 border-b border-slate-100 dark:border-navy-700 flex items-center justify-between"
          >
            <span class="font-semibold text-slate-700 dark:text-navy-100">
              {{ selectedRole ? `Privileges: ${selectedRole.name}` : 'Selecione uma role' }}
            </span>
            <button
              v-if="selectedRole"
              class="btn size-7 p-0 text-primary hover:bg-primary/10 rounded"
              title="Adicionar privilege"
              @click="openAddPrivilege = true"
            >
              <em class="fa-solid fa-plus text-xs"></em>
            </button>
          </div>

          <div
            v-if="!selectedRole"
            class="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-navy-500"
          >
            <em class="fa-solid fa-shield-halved text-3xl mb-2"></em>
            <p class="text-sm">Selecione uma role para ver seus privileges</p>
          </div>

          <div v-else class="divide-y divide-slate-100 dark:divide-navy-700">
            <div
              v-for="priv in selectedRolePrivileges"
              :key="priv.id"
              class="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-navy-750"
            >
              <span class="text-sm font-mono text-slate-700 dark:text-navy-100">{{
                priv.name
              }}</span>
              <button
                class="btn size-6 p-0 text-error hover:bg-error/10 rounded"
                @click="removePrivilege(selectedRole.id, priv.id)"
              >
                <em class="fa-solid fa-times text-xs"></em>
              </button>
            </div>
            <div
              v-if="!selectedRolePrivileges.length"
              class="px-4 py-6 text-center text-slate-400 text-sm"
            >
              Nenhum privilege atribuído
            </div>
          </div>
        </div>
      </div>

      <!-- Privileges library -->
      <div class="card overflow-hidden mt-6">
        <div
          class="px-4 py-3 border-b border-slate-100 dark:border-navy-700 flex items-center justify-between"
        >
          <span class="font-semibold text-slate-700 dark:text-navy-100">Todos os Privileges</span>
          <button
            class="btn px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-focus flex items-center gap-1"
            @click="openCreatePrivilege = true"
          >
            <em class="fa-solid fa-plus text-xs"></em>
            Novo
          </button>
        </div>
        <div class="flex flex-wrap gap-2 p-4">
          <div
            v-for="priv in privileges"
            :key="priv.id"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-navy-700 text-sm"
          >
            <span class="font-mono text-slate-700 dark:text-navy-200">{{ priv.name }}</span>
            <button class="text-slate-400 hover:text-error" @click="handleDeletePrivilege(priv.id)">
              <em class="fa-solid fa-times text-xs"></em>
            </button>
          </div>
          <div v-if="!privileges.length" class="text-sm text-slate-400">Nenhum privilege</div>
        </div>
      </div>

      <!-- Create/Edit Role Modal -->
      <div
        v-if="showRoleModal"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        @click.self="showRoleModal = false"
      >
        <div class="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-[400px] max-w-full p-6">
          <h3 class="font-semibold text-lg mb-4">
            {{ editingRole ? 'Editar Role' : 'Nova Role' }}
          </h3>
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium text-slate-600 dark:text-navy-300">Nome</label>
              <input
                v-model="roleForm.name"
                type="text"
                class="form-input w-full mt-1"
                placeholder="hermes:product:read"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-slate-600 dark:text-navy-300">Descrição</label>
              <input
                v-model="roleForm.description"
                type="text"
                class="form-input w-full mt-1"
                placeholder="Ver produtos"
              />
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-5">
            <button
              class="btn px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
              @click="showRoleModal = false"
            >
              Cancelar
            </button>
            <button
              class="btn px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-focus disabled:opacity-50"
              :disabled="!roleForm.name || saving"
              @click="saveRole"
            >
              <em v-if="saving" class="fa-solid fa-spinner fa-spin mr-1"></em>
              Salvar
            </button>
          </div>
        </div>
      </div>

      <!-- Create Privilege Modal -->
      <div
        v-if="openCreatePrivilege"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        @click.self="openCreatePrivilege = false"
      >
        <div class="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-[360px] max-w-full p-6">
          <h3 class="font-semibold text-lg mb-4">Novo Privilege</h3>
          <input
            v-model="newPrivilegeName"
            type="text"
            class="form-input w-full"
            placeholder="products:read"
          />
          <div class="flex justify-end gap-3 mt-4">
            <button
              class="btn px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
              @click="openCreatePrivilege = false"
            >
              Cancelar
            </button>
            <button
              class="btn px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-focus disabled:opacity-50"
              :disabled="!newPrivilegeName || saving"
              @click="savePrivilege"
            >
              Criar
            </button>
          </div>
        </div>
      </div>

      <!-- Add Privilege to Role Modal -->
      <div
        v-if="openAddPrivilege && selectedRole"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        @click.self="openAddPrivilege = false"
      >
        <div class="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-[400px] max-w-full p-6">
          <h3 class="font-semibold text-lg mb-4">Adicionar Privilege a {{ selectedRole.name }}</h3>
          <div class="max-h-60 overflow-y-auto space-y-1">
            <label
              v-for="priv in availablePrivileges"
              :key="priv.id"
              class="flex items-center gap-3 p-2 rounded hover:bg-slate-50 dark:hover:bg-navy-700 cursor-pointer"
            >
              <input
                type="checkbox"
                :value="priv.id"
                v-model="privilegesToAdd"
                class="accent-primary"
              />
              <span class="font-mono text-sm">{{ priv.name }}</span>
            </label>
            <div v-if="!availablePrivileges.length" class="text-sm text-slate-400 py-2">
              Todos os privileges já foram atribuídos
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-4">
            <button
              class="btn px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
              @click="openAddPrivilege = false"
            >
              Cancelar
            </button>
            <button
              class="btn px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-focus"
              @click="addPrivilegesToRole"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { $axios } from '@/helpers/integration/integration'
import { useRbac } from '../composables/useRbac'
import type { Role, Privilege } from '../composables/useRbac'
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'

const {
  roles,
  privileges,
  loading,
  fetchRoles,
  fetchPrivileges,
  createRole,
  updateRole,
  deleteRole,
  createPrivilege,
  deletePrivilege,
  addPrivilegeToRole,
  removePrivilegeFromRole
} = useRbac()

const selectedRole = ref<Role | null>(null)
const selectedRolePrivileges = ref<Privilege[]>([])
const showRoleModal = ref(false)
const editingRole = ref<Role | null>(null)
const roleForm = ref({ name: '', description: '' })
const openCreatePrivilege = ref(false)
const openAddPrivilege = ref(false)
const newPrivilegeName = ref('')
const privilegesToAdd = ref<string[]>([])
const saving = ref(false)

const availablePrivileges = computed(() => {
  if (!selectedRole.value) return []
  const assignedIds = new Set(selectedRolePrivileges.value.map((p) => p.id))
  return privileges.value.filter((p) => !assignedIds.has(p.id))
})

async function selectRole(role: Role) {
  selectedRole.value = role
  try {
    const res = await $axios.get(`/api/v1/admin/roles/${role.id}/privileges`)
    selectedRolePrivileges.value = res.data.data
  } catch {
    selectedRolePrivileges.value = role.privileges ?? []
  }
}

function openCreateRole() {
  editingRole.value = null
  roleForm.value = { name: '', description: '' }
  showRoleModal.value = true
}

function openEditRole(role: Role) {
  editingRole.value = role
  roleForm.value = { name: role.name, description: role.description ?? '' }
  showRoleModal.value = true
}

async function saveRole() {
  saving.value = true
  try {
    if (editingRole.value) {
      const updated = await updateRole(
        editingRole.value.id,
        roleForm.value.name,
        roleForm.value.description
      )
      const idx = roles.value.findIndex((r) => r.id === updated.id)
      if (idx !== -1) roles.value[idx] = updated
    } else {
      const created = await createRole(roleForm.value.name, roleForm.value.description)
      roles.value.push(created)
    }
    showRoleModal.value = false
  } finally {
    saving.value = false
  }
}

async function confirmDeleteRole(role: Role) {
  if (!confirm(`Excluir role "${role.name}"?`)) return
  await deleteRole(role.id)
  roles.value = roles.value.filter((r) => r.id !== role.id)
  if (selectedRole.value?.id === role.id) selectedRole.value = null
}

async function savePrivilege() {
  saving.value = true
  try {
    const created = await createPrivilege(newPrivilegeName.value)
    privileges.value.push(created)
    newPrivilegeName.value = ''
    openCreatePrivilege.value = false
  } finally {
    saving.value = false
  }
}

async function handleDeletePrivilege(id: string) {
  if (!confirm('Excluir este privilege?')) return
  await deletePrivilege(id)
  privileges.value = privileges.value.filter((p) => p.id !== id)
  selectedRolePrivileges.value = selectedRolePrivileges.value.filter((p) => p.id !== id)
}

async function addPrivilegesToRole() {
  if (!selectedRole.value) return
  for (const privId of privilegesToAdd.value) {
    await addPrivilegeToRole(selectedRole.value.id, privId)
    const priv = privileges.value.find((p) => p.id === privId)
    if (priv) selectedRolePrivileges.value.push(priv)
  }
  privilegesToAdd.value = []
  openAddPrivilege.value = false
}

async function removePrivilege(roleId: string, privilegeId: string) {
  await removePrivilegeFromRole(roleId, privilegeId)
  selectedRolePrivileges.value = selectedRolePrivileges.value.filter((p) => p.id !== privilegeId)
}

onMounted(async () => {
  await Promise.all([fetchRoles(), fetchPrivileges()])
})
</script>
