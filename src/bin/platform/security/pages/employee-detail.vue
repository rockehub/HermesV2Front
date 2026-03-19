<template>
  <DefaultLayout
    :icon="{ type: 'fa', icon: 'fa-light fa-diagram-project text-[1.2rem]' }"
    :menu-items="[]"
  >
  <div class="p-6 max-w-3xl">
    <div class="flex items-center gap-3 mb-6">
      <button
        class="btn size-9 p-0 rounded hover:bg-slate-100 dark:hover:bg-navy-700"
        @click="router.push({ name: 'security-employees' })"
      >
        <em class="fa-solid fa-arrow-left"></em>
      </button>
      <div>
        <h1 class="text-2xl font-semibold text-slate-800 dark:text-navy-100">
          {{ employee ? `${employee.name} ${employee.surname}` : 'Carregando...' }}
        </h1>
        <p v-if="employee" class="text-sm text-slate-500 dark:text-navy-400">
          {{ employee.email }} · @{{ employee.username }}
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <em class="fa-solid fa-spinner fa-spin text-2xl text-primary"></em>
    </div>

    <div v-else-if="employee" class="space-y-6">
      <!-- Employee Info -->
      <div class="card p-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-slate-700 dark:text-navy-100">Informações</h2>
          <span
            class="px-2 py-0.5 rounded-full text-xs font-medium"
            :class="employee.active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'"
          >
            {{ employee.active ? 'Ativo' : 'Inativo' }}
          </span>
        </div>
      </div>

      <!-- Roles Assignment -->
      <div class="card p-4">
        <h2 class="font-semibold text-slate-700 dark:text-navy-100 mb-4">Roles</h2>

        <div v-if="rolesLoading" class="flex justify-center py-4">
          <em class="fa-solid fa-spinner fa-spin text-primary"></em>
        </div>

        <div v-else>
          <!-- Group roles by pluginId -->
          <div v-for="group in roleGroups" :key="group.label" class="mb-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-navy-400 mb-2">
              {{ group.label }}
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                v-for="role in group.roles"
                :key="role.id"
                class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition"
                :class="selectedRoleIds.has(role.id)
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-slate-200 dark:border-navy-600 hover:border-slate-300'"
              >
                <input
                  type="checkbox"
                  :value="role.id"
                  :checked="selectedRoleIds.has(role.id)"
                  class="mt-0.5 accent-primary"
                  @change="toggleRole(role.id)"
                />
                <div>
                  <p class="text-sm font-medium text-slate-700 dark:text-navy-100">{{ role.name }}</p>
                  <p v-if="role.description" class="text-xs text-slate-400 dark:text-navy-400 mt-0.5">
                    {{ role.description }}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div class="flex justify-end mt-4">
            <button
              class="btn px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-focus disabled:opacity-50"
              :disabled="saving"
              @click="saveRoles"
            >
              <em v-if="saving" class="fa-solid fa-spinner fa-spin mr-1"></em>
              Salvar roles
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useRbac } from '../composables/useRbac'
import type { AdminEmployee, Role } from '../composables/useRbac'
import router from '@/helpers/routes/main'
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'

const route = useRoute()
const id = route.params.id as string

const { roles, fetchRoles, fetchEmployee, assignRoles } = useRbac()

const employee = ref<AdminEmployee | null>(null)
const loading = ref(true)
const rolesLoading = ref(true)
const saving = ref(false)
const selectedRoleIds = ref<Set<string>>(new Set())

const roleGroups = computed(() => {
  const groups: Record<string, { label: string; roles: Role[] }> = {}

  roles.value.forEach(role => {
    const key = role.pluginId ?? '__global'
    if (!groups[key]) {
      groups[key] = {
        label: role.pluginId ? `Plugin: ${role.pluginId}` : 'Global',
        roles: []
      }
    }
    groups[key].roles.push(role)
  })

  return Object.values(groups)
})

function toggleRole(roleId: string) {
  if (selectedRoleIds.value.has(roleId)) {
    selectedRoleIds.value.delete(roleId)
  } else {
    selectedRoleIds.value.add(roleId)
  }
}

async function saveRoles() {
  saving.value = true
  try {
    await assignRoles(id, Array.from(selectedRoleIds.value))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    employee.value = await fetchEmployee(id)
    employee.value.roles?.forEach(r => selectedRoleIds.value.add(r.id))
  } finally {
    loading.value = false
  }

  try {
    await fetchRoles()
  } finally {
    rolesLoading.value = false
  }
})
</script>
