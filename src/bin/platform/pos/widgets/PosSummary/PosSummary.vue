<script lang="ts" setup>
import { usePosStore } from '../../store/usePosStore'

const posStore = usePosStore()

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>

<template>
  <div class="flex h-full flex-col bg-white dark:bg-navy-750 rounded-lg p-4 gap-3">
    <h3 class="text-sm font-semibold text-slate-700 dark:text-navy-100">
      <em class="fa-light fa-file-invoice-dollar mr-2 text-primary"></em>
      Resumo da Venda
    </h3>

    <div class="grid grid-cols-2 gap-3 flex-1">
      <!-- Items count -->
      <div class="rounded-lg bg-slate-50 dark:bg-navy-700 px-3 py-2.5">
        <p class="text-xs text-slate-400 dark:text-navy-400">Itens</p>
        <p class="text-xl font-bold text-slate-700 dark:text-navy-100">{{ posStore.cart?.entriesCount ?? 0 }}</p>
      </div>

      <!-- Total -->
      <div class="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5">
        <p class="text-xs text-slate-400 dark:text-navy-400">Total</p>
        <p class="text-lg font-bold text-primary">{{ formatCurrency(posStore.cartTotal) }}</p>
      </div>

      <!-- Customer -->
      <div class="col-span-2 rounded-lg bg-slate-50 dark:bg-navy-700 px-3 py-2.5">
        <p class="text-xs text-slate-400 dark:text-navy-400 mb-0.5">Cliente</p>
        <p class="text-sm font-medium text-slate-700 dark:text-navy-100 truncate">
          {{ posStore.customer ? `${posStore.customer.name} ${posStore.customer.surname}` : 'Consumidor final' }}
        </p>
      </div>

      <!-- Discount -->
      <div v-if="posStore.cart?.totalDiscounts && posStore.cart.totalDiscounts > 0" class="col-span-2 rounded-lg bg-success/5 border border-success/20 px-3 py-2.5">
        <p class="text-xs text-slate-400 dark:text-navy-400">Desconto aplicado</p>
        <p class="text-sm font-bold text-success">-{{ formatCurrency(posStore.cart.totalDiscounts) }}</p>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="flex gap-2">
      <button
        class="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-navy-600 py-2 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors"
        title="Nova venda"
        @click="posStore.newSale()"
      >
        <em class="fa-light fa-plus"></em>
        Nova venda
      </button>
    </div>
  </div>
</template>
