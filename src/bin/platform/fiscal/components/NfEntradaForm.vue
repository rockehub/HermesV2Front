<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useFiscalApi, type EntradaRequest } from '../composables/useFiscalApi'

const { emitEntrada } = useFiscalApi()

const form = reactive<EntradaRequest>({
  cnpjFornecedor: '',
  nomeFornecedor: '',
  naturezaOperacao: 'Compra de mercadoria',
  itens: []
})

const submitting = ref(false)
const error      = ref('')
const success    = ref(false)
const successRef = ref('')

function addItem() {
  form.itens.push({ descricao: '', ncm: '', cfop: '1102', quantidade: 1, valorUnitario: 0 })
}

function removeItem(idx: number) {
  form.itens.splice(idx, 1)
}

async function submit() {
  error.value   = ''
  success.value = false

  if (!form.cnpjFornecedor)    { error.value = 'CNPJ do fornecedor é obrigatório.'; return }
  if (form.itens.length === 0) { error.value = 'Adicione ao menos um item.'; return }

  submitting.value = true
  try {
    const res = await emitEntrada(form)
    success.value    = true
    successRef.value = res.data.ref
    form.itens           = []
    form.cnpjFornecedor  = ''
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Erro ao emitir NF-e de entrada.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-5">

    <!-- Cabeçalho -->
    <div>
      <h2 class="text-xl font-semibold text-slate-700 dark:text-navy-100">NF-e Entrada</h2>
      <p class="text-sm text-slate-400 dark:text-navy-400 mt-0.5">
        Emite uma NF-e de entrada (compra de fornecedor) via provider fiscal ativo.
      </p>
    </div>

    <div class="card p-5 space-y-4">

      <!-- Dados do fornecedor -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-xs font-semibold uppercase text-slate-500 dark:text-navy-300">
            CNPJ do Fornecedor <span class="text-error">*</span>
          </label>
          <input
            v-model="form.cnpjFornecedor"
            type="text"
            maxlength="14"
            placeholder="00000000000191"
            class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-semibold uppercase text-slate-500 dark:text-navy-300">
            Nome do Fornecedor
          </label>
          <input
            v-model="form.nomeFornecedor"
            type="text"
            placeholder="Empresa Ltda"
            class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
          />
        </div>
        <div class="sm:col-span-2">
          <label class="mb-1.5 block text-xs font-semibold uppercase text-slate-500 dark:text-navy-300">
            Natureza da Operação
          </label>
          <input
            v-model="form.naturezaOperacao"
            type="text"
            placeholder="Compra de mercadoria"
            class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
          />
        </div>
      </div>

      <!-- Itens -->
      <div>
        <div class="mb-3 flex items-center justify-between">
          <span class="text-xs font-semibold uppercase text-slate-500 dark:text-navy-300">
            Itens <span class="text-error">*</span>
          </span>
          <button
            @click="addItem"
            class="btn btn-xs bg-primary/10 text-primary hover:bg-primary/20"
          >
            <em class="fa-light fa-plus mr-1"></em>
            Adicionar item
          </button>
        </div>

        <div
          v-for="(item, idx) in form.itens"
          :key="idx"
          class="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-navy-600 dark:bg-navy-750"
        >
          <div class="grid grid-cols-6 gap-3">
            <div class="col-span-6 sm:col-span-3">
              <label class="mb-1 block text-xs text-slate-400 dark:text-navy-400">Descrição *</label>
              <input
                v-model="item.descricao"
                type="text"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
              />
            </div>
            <div class="col-span-3 sm:col-span-1">
              <label class="mb-1 block text-xs text-slate-400 dark:text-navy-400">NCM</label>
              <input
                v-model="item.ncm"
                type="text"
                maxlength="8"
                placeholder="00000000"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
              />
            </div>
            <div class="col-span-3 sm:col-span-1">
              <label class="mb-1 block text-xs text-slate-400 dark:text-navy-400">CFOP</label>
              <input
                v-model="item.cfop"
                type="text"
                maxlength="4"
                placeholder="1102"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
              />
            </div>
            <div class="col-span-3 sm:col-span-1">
              <label class="mb-1 block text-xs text-slate-400 dark:text-navy-400">Qtd *</label>
              <input
                v-model.number="item.quantidade"
                type="number"
                min="1"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
              />
            </div>
            <div class="col-span-3 sm:col-span-2">
              <label class="mb-1 block text-xs text-slate-400 dark:text-navy-400">Valor Unitário *</label>
              <input
                v-model.number="item.valorUnitario"
                type="number"
                min="0"
                step="0.01"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
              />
            </div>
            <div class="col-span-1 flex items-end">
              <button
                @click="removeItem(idx)"
                class="btn btn-xs bg-error/10 text-error hover:bg-error/20"
              >
                <em class="fa-light fa-trash text-[10px]"></em>
              </button>
            </div>
          </div>
        </div>

        <p v-if="form.itens.length === 0" class="text-sm text-slate-400 dark:text-navy-400">
          Nenhum item adicionado.
        </p>
      </div>

      <!-- Alertas -->
      <div v-if="error" class="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
        {{ error }}
      </div>
      <div v-if="success" class="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
        NF-e de entrada criada com sucesso! Ref: <strong>{{ successRef }}</strong>
      </div>

      <!-- Ação -->
      <div class="flex justify-end">
        <button
          @click="submit"
          :disabled="submitting"
          class="btn bg-primary font-medium text-white hover:bg-primary-focus disabled:opacity-50"
        >
          <em v-if="submitting" class="fa-solid fa-spinner fa-spin mr-1.5"></em>
          {{ submitting ? 'Emitindo...' : 'Emitir NF-e Entrada' }}
        </button>
      </div>
    </div>

  </div>
</template>
