<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { usePosApi } from '../../composables/usePosApi'
import { usePosStore } from '../../store/usePosStore'

const api = usePosApi()
const posStore = usePosStore()

const orders = ref<any[]>([])
const loading = ref(false)
const selectedOrder = ref<any | null>(null)
let refreshInterval: ReturnType<typeof setInterval> | null = null

async function fetchOrders() {
  loading.value = true
  try {
    const res = await api.listOrders(0, 20)
    orders.value = res.data.data?.content ?? res.data.data ?? []
  } finally {
    loading.value = false
  }
}

async function openOrder(order: any) {
  const res = await api.getOrder(order.id)
  selectedOrder.value = res.data.data
}

async function cancelOrder(orderId: string) {
  await api.cancelOrder(orderId, 'Cancelado pelo operador PDV')
  selectedOrder.value = null
  await fetchOrders()
}

function formatCurrency(cents: number) {
  if (!cents) return 'R$ 0,00'
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatTime(dateStr: string) {
  if (!dateStr) return '--'
  try {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '--'
  }
}

function stateLabel(state: any) {
  if (!state) return 'Processando'
  return state.name ?? state.code ?? 'N/A'
}

function stateColor(state: any) {
  const code = state?.code ?? ''
  if (code === 'confirmed') return 'text-success'
  if (code === 'cancelled') return 'text-error'
  if (code === 'pending_payment') return 'text-amber-500'
  return 'text-slate-500'
}

onMounted(async () => {
  await fetchOrders()
  // Watch store for new orders (after checkout)
  refreshInterval = setInterval(fetchOrders, 30000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<template>
  <div class="flex h-full flex-col bg-white dark:bg-navy-750 rounded-lg overflow-hidden">
    <div class="flex items-center justify-between border-b border-slate-100 dark:border-navy-700 px-4 py-3">
      <h3 class="text-sm font-semibold text-slate-700 dark:text-navy-100">
        <em class="fa-light fa-receipt mr-2 text-primary"></em>
        Vendas Recentes
      </h3>
      <button class="text-slate-400 hover:text-primary transition-colors" @click="fetchOrders">
        <em class="fa-light fa-refresh text-xs" :class="{ 'fa-spin': loading }"></em>
      </button>
    </div>

    <!-- Order detail modal -->
    <div v-if="selectedOrder" class="absolute inset-0 z-10 flex items-start bg-black/30 p-4" @click.self="selectedOrder = null">
      <div class="w-full rounded-xl bg-white dark:bg-navy-750 shadow-xl overflow-hidden">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-navy-700 px-4 py-3">
          <h4 class="text-sm font-semibold text-slate-700 dark:text-navy-100">Pedido #{{ selectedOrder.number }}</h4>
          <button class="text-slate-400 hover:text-slate-600" @click="selectedOrder = null">
            <em class="fa-light fa-times"></em>
          </button>
        </div>
        <div class="p-4 space-y-3 max-h-80 overflow-y-auto">
          <div v-for="entry in selectedOrder.entries" :key="entry.id" class="flex items-center justify-between text-xs">
            <span class="text-slate-700 dark:text-navy-100">{{ entry.name }} × {{ entry.quantity }}</span>
            <span class="font-medium text-slate-700 dark:text-navy-100">{{ formatCurrency(entry.totalPostTaxes) }}</span>
          </div>
          <div class="border-t border-slate-100 dark:border-navy-700 pt-2 flex justify-between font-semibold text-sm">
            <span>Total</span>
            <span class="text-primary">{{ formatCurrency(selectedOrder.total?.totalPostTaxes) }}</span>
          </div>
        </div>
        <div class="border-t border-slate-100 dark:border-navy-700 p-3 flex gap-2">
          <button
            v-if="selectedOrder.state?.code !== 'cancelled'"
            class="flex-1 rounded-lg bg-error/10 py-2 text-xs font-medium text-error hover:bg-error/20 transition-colors"
            @click="cancelOrder(selectedOrder.id)"
          >
            Cancelar pedido
          </button>
          <button
            class="flex-1 rounded-lg border border-slate-200 dark:border-navy-600 py-2 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors"
            @click="selectedOrder = null"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="flex-1 overflow-y-auto is-scrollbar-hidden">
      <div v-if="loading && orders.length === 0" class="flex h-32 items-center justify-center">
        <em class="fa-duotone fa-spinner-third fa-spin text-primary text-xl"></em>
      </div>
      <div v-else-if="orders.length === 0" class="flex h-32 flex-col items-center justify-center text-slate-400">
        <em class="fa-light fa-receipt text-2xl mb-2 opacity-30"></em>
        <p class="text-xs">Nenhuma venda registrada</p>
      </div>
      <table v-else class="w-full text-xs">
        <thead>
          <tr class="border-b border-slate-100 dark:border-navy-700 text-left">
            <th class="px-4 py-2 text-slate-400 dark:text-navy-400 font-medium">#</th>
            <th class="px-2 py-2 text-slate-400 dark:text-navy-400 font-medium">Cliente</th>
            <th class="px-2 py-2 text-slate-400 dark:text-navy-400 font-medium text-right">Total</th>
            <th class="px-2 py-2 text-slate-400 dark:text-navy-400 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="order in orders"
            :key="order.id"
            class="border-b border-slate-50 dark:border-navy-700 hover:bg-slate-50 dark:hover:bg-navy-700 cursor-pointer transition-colors"
            @click="openOrder(order)"
          >
            <td class="px-4 py-2.5 font-medium text-slate-700 dark:text-navy-100">{{ order.number }}</td>
            <td class="px-2 py-2.5 text-slate-500 dark:text-navy-300 max-w-[100px] truncate">
              {{ order.customer ? `${order.customer.name}` : 'Consumidor' }}
            </td>
            <td class="px-2 py-2.5 text-right font-medium text-slate-700 dark:text-navy-100">
              {{ formatCurrency(order.total?.totalPostTaxes) }}
            </td>
            <td class="px-2 py-2.5">
              <span :class="stateColor(order.state)" class="font-medium">{{ stateLabel(order.state) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
