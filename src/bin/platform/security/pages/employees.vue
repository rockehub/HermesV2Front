<template>
  <DefaultLayout
    :icon="{ type: 'fa', icon: 'fa-light fa-diagram-project text-[1.2rem]' }"
    :menu-items="[]"
  >
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-slate-800 dark:text-navy-100">Employees</h1>
          <p class="text-sm text-slate-500 dark:text-navy-400 mt-1">
            Gerencie employees e suas roles
          </p>
        </div>
      </div>

      <!-- Search -->
      <div class="mb-4">
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nome, email ou username..."
          class="form-input w-full max-w-sm bg-white dark:bg-navy-700 border border-slate-200 dark:border-navy-600"
        />
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        <div v-if="loading" class="flex justify-center py-12">
          <em class="fa-solid fa-spinner fa-spin text-2xl text-primary"></em>
        </div>

        <table v-else class="w-full text-sm">
          <thead
            class="bg-slate-50 dark:bg-navy-800 text-xs uppercase text-slate-500 dark:text-navy-400"
          >
            <tr>
              <th class="px-4 py-3 text-left">Nome</th>
              <th class="px-4 py-3 text-left">Email / Username</th>
              <th class="px-4 py-3 text-left">Status</th>
              <th class="px-4 py-3 text-left">Roles</th>
              <th class="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-navy-700">
            <tr
              v-for="emp in filteredEmployees"
              :key="emp.id"
              class="hover:bg-slate-50 dark:hover:bg-navy-750 transition"
            >
              <td class="px-4 py-3 font-medium text-slate-700 dark:text-navy-100">
                {{ emp.name }} {{ emp.surname }}
              </td>
              <td class="px-4 py-3 text-slate-500 dark:text-navy-400">
                <div>{{ emp.email }}</div>
                <div class="text-xs">@{{ emp.username }}</div>
              </td>
              <td class="px-4 py-3">
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="emp.active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'"
                >
                  {{ emp.active ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="role in emp.roles"
                    :key="role.id"
                    class="px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary dark:bg-primary/20"
                  >
                    {{ role.name }}
                  </span>
                  <span v-if="!emp.roles?.length" class="text-xs text-slate-400">Nenhuma</span>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    class="btn size-8 p-0 text-primary hover:bg-primary/10 rounded"
                    title="Editar roles"
                    @click="router.push({ name: 'security-employee', params: { id: emp.id } })"
                  >
                    <em class="fa-solid fa-user-pen text-sm"></em>
                  </button>
                  <button
                    class="btn size-8 p-0 rounded"
                    :class="
                      emp.active
                        ? 'text-error hover:bg-error/10'
                        : 'text-success hover:bg-success/10'
                    "
                    :title="emp.active ? 'Desativar' : 'Ativar'"
                    @click="toggleActive(emp)"
                  >
                    <em
                      :class="emp.active ? 'fa-solid fa-ban' : 'fa-solid fa-check-circle'"
                      class="text-sm"
                    ></em>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredEmployees.length">
              <td colspan="5" class="px-4 py-8 text-center text-slate-400 dark:text-navy-500">
                Nenhum employee encontrado
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div
          v-if="totalEmployees > pageSize"
          class="flex justify-between items-center px-4 py-3 border-t border-slate-100 dark:border-navy-700"
        >
          <span class="text-xs text-slate-500">{{ totalEmployees }} employees</span>
          <div class="flex gap-1">
            <button
              class="btn size-8 p-0 rounded disabled:opacity-40"
              :disabled="page === 0"
              @click="changePage(page - 1)"
            >
              <em class="fa-solid fa-chevron-left text-xs"></em>
            </button>
            <span class="flex items-center px-3 text-sm">{{ page + 1 }}</span>
            <button
              class="btn size-8 p-0 rounded disabled:opacity-40"
              :disabled="(page + 1) * pageSize >= totalEmployees"
              @click="changePage(page + 1)"
            >
              <em class="fa-solid fa-chevron-right text-xs"></em>
            </button>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRbac } from '../composables/useRbac'
import router from '@/helpers/routes/main'
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'

const { employees, loading, totalEmployees, fetchEmployees, setEmployeeActive } = useRbac()

const search = ref('')
const page = ref(0)
const pageSize = 20

const filteredEmployees = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return employees.value
  return employees.value.filter(
    (e) =>
      `${e.name} ${e.surname}`.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.username.toLowerCase().includes(q)
  )
})

async function toggleActive(emp: any) {
  await setEmployeeActive(emp.id, !emp.active)
  emp.active = !emp.active
}

async function changePage(p: number) {
  page.value = p
  await fetchEmployees(p, pageSize)
}

onMounted(() => fetchEmployees(0, pageSize))
</script>
