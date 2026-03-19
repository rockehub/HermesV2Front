<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useFiscalApi, type CteRequest } from '../composables/useFiscalApi'

const { emitCte } = useFiscalApi()

const form = reactive<CteRequest>({
  tomadorCnpj: '',
  tomadorNome: '',
  valorPrestacao: 0,
  modal: '01',
  naturezaPrestacao: 'Prestação de serviço de transporte'
})

const submitting = ref(false)
const error      = ref('')
const success    = ref(false)
const successRef = ref('')

async function submit() {
  error.value   = ''
  success.value = false

  if (!form.tomadorCnpj)    { error.value = 'CNPJ do tomador é obrigatório.'; return }
  if (!form.valorPrestacao) { error.value = 'Valor da prestação é obrigatório.'; return }

  submitting.value = true
  try {
    const res = await emitCte(form)
    success.value       = true
    successRef.value    = res.data.ref
    form.tomadorCnpj    = ''
    form.valorPrestacao = 0
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Erro ao emitir CT-e.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-5">

    <!-- Cabeçalho -->
    <div>
      <h2 class="text-xl font-semibold text-slate-700 dark:text-navy-100">CT-e</h2>
      <p class="text-sm text-slate-400 dark:text-navy-400 mt-0.5">
        Emite um Conhecimento de Transporte Eletrônico via provider fiscal ativo.
      </p>
    </div>

    <div class="card p-5 space-y-4">

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-xs font-semibold uppercase text-slate-500 dark:text-navy-300">
            CNPJ do Tomador <span class="text-error">*</span>
          </label>
          <input
            v-model="form.tomadorCnpj"
            type="text"
            maxlength="14"
            placeholder="00000000000191"
            class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-semibold uppercase text-slate-500 dark:text-navy-300">
            Nome do Tomador
          </label>
          <input
            v-model="form.tomadorNome"
            type="text"
            placeholder="Empresa Transportada"
            class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-semibold uppercase text-slate-500 dark:text-navy-300">
            Valor da Prestação (R$) <span class="text-error">*</span>
          </label>
          <input
            v-model.number="form.valorPrestacao"
            type="number"
            min="0"
            step="0.01"
            class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-semibold uppercase text-slate-500 dark:text-navy-300">
            Modal
          </label>
          <select
            v-model="form.modal"
            class="form-select w-full rounded-lg border border-slate-300 bg-white px-3 py-2 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
          >
            <option value="01">01 — Rodoviário</option>
            <option value="02">02 — Aéreo</option>
            <option value="03">03 — Aquaviário</option>
            <option value="04">04 — Ferroviário</option>
            <option value="05">05 — Dutoviário</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="mb-1.5 block text-xs font-semibold uppercase text-slate-500 dark:text-navy-300">
            Natureza da Prestação
          </label>
          <input
            v-model="form.naturezaPrestacao"
            type="text"
            placeholder="Prestação de serviço de transporte"
            class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
          />
        </div>
      </div>

      <!-- Alertas -->
      <div v-if="error" class="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
        {{ error }}
      </div>
      <div v-if="success" class="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
        CT-e criado com sucesso! Ref: <strong>{{ successRef }}</strong>
      </div>

      <!-- Ação -->
      <div class="flex justify-end">
        <button
          @click="submit"
          :disabled="submitting"
          class="btn bg-primary font-medium text-white hover:bg-primary-focus disabled:opacity-50"
        >
          <em v-if="submitting" class="fa-solid fa-spinner fa-spin mr-1.5"></em>
          {{ submitting ? 'Emitindo...' : 'Emitir CT-e' }}
        </button>
      </div>
    </div>

  </div>
</template>
