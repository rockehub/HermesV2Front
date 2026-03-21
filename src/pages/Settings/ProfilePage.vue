<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SidebarComponent from '@/components/sidebar/sidebar.vue'
import HeaderComponent from '@/components/header/header.vue'
import { $axios } from '@/helpers/integration/integration'
import { useAuthStore } from '@/stores/auth'
import notification from '@/helpers/utils/notification'

const auth = useAuthStore()
const toast = notification

const profileForm = ref({ name: '', surname: '', email: '' })
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })

const savingProfile = ref(false)
const savingPassword = ref(false)

onMounted(() => {
  profileForm.value.name = auth.user?.name ?? ''
  profileForm.value.surname = (auth.user as any)?.surname ?? ''
  profileForm.value.email = (auth.user as any)?.email ?? ''
})

async function saveProfile() {
  if (!profileForm.value.name || !profileForm.value.email) {
    toast({ text: 'Nome e e-mail são obrigatórios', variant: 'error' })
    return
  }
  savingProfile.value = true
  try {
    await $axios.patch('/api/v1/user', {
      name: profileForm.value.name,
      surname: profileForm.value.surname,
      email: profileForm.value.email
    })
    await auth.fetchUserProfile()
    toast({ text: 'Perfil atualizado com sucesso', variant: 'success' })
  } catch (error: any) {
    const msg = error.response?.data?.message ?? 'Erro ao salvar perfil'
    toast({ text: msg, variant: 'error' })
  } finally {
    savingProfile.value = false
  }
}

async function changePassword() {
  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword) {
    toast({ text: 'Preencha todos os campos de senha', variant: 'error' })
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast({ text: 'As senhas não coincidem', variant: 'error' })
    return
  }
  if (passwordForm.value.newPassword.length < 8) {
    toast({ text: 'A nova senha deve ter pelo menos 8 caracteres', variant: 'error' })
    return
  }
  savingPassword.value = true
  try {
    await $axios.patch('/api/v1/user/password', {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    toast({ text: 'Senha alterada com sucesso', variant: 'success' })
  } catch (error: any) {
    const msg = error.response?.data?.message ?? 'Erro ao alterar senha'
    toast({ text: msg, variant: 'error' })
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <sidebar-component />
  <main class="main-content w-full pb-8">
    <header-component />
    <div class="grow overflow-y-auto px-[calc(var(--margin-x)-.5rem)] py-5 transition-all duration-[.25s]">

      <div class="mb-6">
        <h2 class="text-xl font-semibold text-slate-800 dark:text-navy-50">Meu Perfil</h2>
        <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">Gerencie suas informações pessoais e senha de acesso</p>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">

        <!-- Dados Pessoais -->
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-navy-500 dark:bg-navy-700">
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <svg class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 dark:text-navy-100">Dados Pessoais</h3>
              <p class="text-xs text-slate-400 dark:text-navy-300">Nome e e-mail de acesso</p>
            </div>
          </div>

          <form @submit.prevent="saveProfile" class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">Nome</label>
                <input
                  v-model="profileForm.name"
                  type="text"
                  placeholder="Seu nome"
                  class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:text-navy-100 dark:hover:border-navy-400 dark:focus:border-accent"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">Sobrenome</label>
                <input
                  v-model="profileForm.surname"
                  type="text"
                  placeholder="Seu sobrenome"
                  class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:text-navy-100 dark:hover:border-navy-400 dark:focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">E-mail</label>
              <input
                v-model="profileForm.email"
                type="email"
                placeholder="seu@email.com"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:text-navy-100 dark:hover:border-navy-400 dark:focus:border-accent"
              />
            </div>
            <div class="pt-1">
              <button
                type="submit"
                :disabled="savingProfile"
                class="btn h-9 bg-primary px-5 text-sm font-medium text-white hover:bg-primary-focus focus:bg-primary-focus disabled:opacity-60 dark:bg-accent dark:hover:bg-accent-focus dark:focus:bg-accent-focus"
              >
                <span v-if="savingProfile">Salvando...</span>
                <span v-else>Salvar alterações</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Trocar Senha -->
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-navy-500 dark:bg-navy-700">
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <svg class="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 dark:text-navy-100">Trocar Senha</h3>
              <p class="text-xs text-slate-400 dark:text-navy-300">Mínimo 8 caracteres</p>
            </div>
          </div>

          <form @submit.prevent="changePassword" class="space-y-4">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">Senha atual</label>
              <input
                v-model="passwordForm.currentPassword"
                type="password"
                placeholder="••••••••"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:text-navy-100 dark:hover:border-navy-400 dark:focus:border-accent"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">Nova senha</label>
              <input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="••••••••"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:text-navy-100 dark:hover:border-navy-400 dark:focus:border-accent"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">Confirmar nova senha</label>
              <input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="••••••••"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:text-navy-100 dark:hover:border-navy-400 dark:focus:border-accent"
              />
            </div>
            <div class="pt-1">
              <button
                type="submit"
                :disabled="savingPassword"
                class="btn h-9 bg-warning px-5 text-sm font-medium text-white hover:bg-warning/80 focus:bg-warning/80 disabled:opacity-60"
              >
                <span v-if="savingPassword">Alterando...</span>
                <span v-else>Alterar senha</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  </main>
</template>
