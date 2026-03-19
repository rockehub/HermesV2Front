<template>
  <DefaultLayout :icon="{ type: 'fa', icon: 'fa-light fa-bag-shopping text-[1.2rem]' }" :menu-items="[]">
    <div class="min-h-screen bg-slate-100 px-6 py-6 dark:bg-navy-900">
      <div class="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900 dark:text-navy-50">Pedidos</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">Operacao, cliente, entrega, financeiro e historico no mesmo lugar.</p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input v-model="filters.q" type="text" placeholder="Buscar por numero ou cliente"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100 lg:w-72" />
          <select v-model="filters.status"
            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100">
            <option value="">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="cancelled">Cancelado</option>
            <option value="in-route">Em rota</option>
          </select>
          <select v-model="filters.channel"
            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100">
            <option value="">Todos os canais</option>
            <option value="pdv">PDV</option>
            <option value="web">Site</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="telemarketing">Telemarketing</option>
          </select>
          <button class="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-primary dark:hover:bg-primary/90" @click="fetchOrders">
            Atualizar
          </button>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-navy-600 dark:bg-navy-800">
          <div class="border-b border-slate-100 px-5 py-4 dark:border-navy-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-navy-400">Fila</p>
                <h2 class="mt-1 text-lg font-semibold text-slate-900 dark:text-navy-50">Pedidos recentes</h2>
              </div>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-navy-700 dark:text-navy-200">{{ page.totalElements }}</span>
            </div>
          </div>

          <div v-if="listLoading && orders.length === 0" class="flex h-72 items-center justify-center">
            <em class="fa-duotone fa-spinner-third fa-spin text-2xl text-primary"></em>
          </div>

          <div v-else-if="orders.length === 0" class="flex h-72 flex-col items-center justify-center px-6 text-center text-slate-400 dark:text-navy-400">
            <em class="fa-light fa-bag-shopping text-3xl"></em>
            <p class="mt-3 text-sm">Nenhum pedido encontrado.</p>
          </div>

          <div v-else class="max-h-[calc(100vh-13rem)] overflow-y-auto p-3">
            <button
              v-for="order in orders"
              :key="order.id"
              class="mb-3 w-full rounded-2xl border p-4 text-left transition"
              :class="selectedOrderId === order.id
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-navy-600 dark:bg-navy-800 dark:hover:border-navy-500'"
              @click="selectOrder(order.id)"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2">
                    <span :class="statusPill(order.header.statusTone)" class="rounded-full px-2.5 py-1 text-[11px] font-semibold">{{ order.header.statusLabel }}</span>
                    <span class="text-[11px] uppercase tracking-[0.18em] text-slate-400 dark:text-navy-400">{{ order.header.channelLabel ?? 'Canal direto' }}</span>
                  </div>
                  <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-navy-50">Pedido #{{ order.number }}</h3>
                  <p class="mt-1 text-sm text-slate-600 dark:text-navy-300">{{ order.header.customerName }}</p>
                </div>
                <div class="text-right">
                  <p class="text-[11px] uppercase tracking-[0.18em] text-slate-400 dark:text-navy-400">Total</p>
                  <p class="mt-1 text-xl font-black text-slate-900 dark:text-navy-50">{{ formatCurrency(order.header.totalInCents) }}</p>
                  <p class="mt-1 text-xs text-slate-400 dark:text-navy-400">{{ order.header.createdAtRelative }}</p>
                </div>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <span v-for="tag in order.header.customerTags" :key="tag" class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-navy-700 dark:text-navy-200">{{ tag }}</span>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-navy-300">
                <div>
                  <p class="uppercase tracking-[0.14em] text-slate-400 dark:text-navy-400">Recorrencia</p>
                  <p class="mt-1 font-medium text-slate-700 dark:text-navy-100">{{ recurringLabel(order.customer.ordersLast30Days) }}</p>
                </div>
                <div>
                  <p class="uppercase tracking-[0.14em] text-slate-400 dark:text-navy-400">Pagamento</p>
                  <p class="mt-1 font-medium text-slate-700 dark:text-navy-100">{{ order.finance.paymentStatusLabel ?? 'Pendente' }}</p>
                </div>
              </div>

              <div v-if="order.insights.length" class="mt-4 flex flex-wrap gap-2">
                <span v-for="insight in order.insights" :key="insight.code" :class="insightPill(insight.tone)" class="rounded-full px-2.5 py-1 text-[11px] font-semibold">{{ insight.label }}</span>
              </div>
            </button>
          </div>
        </section>

        <section class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-navy-600 dark:bg-navy-800">
          <div v-if="detailLoading && !selectedOrder" class="flex h-[calc(100vh-13rem)] items-center justify-center">
            <em class="fa-duotone fa-spinner-third fa-spin text-2xl text-primary"></em>
          </div>

          <div v-else-if="!selectedOrder" class="flex h-[calc(100vh-13rem)] flex-col items-center justify-center px-8 text-center text-slate-400 dark:text-navy-400">
            <em class="fa-light fa-rectangle-list text-4xl"></em>
            <p class="mt-4 text-base">Selecione um pedido para abrir o painel completo.</p>
          </div>

          <div v-else class="max-h-[calc(100vh-13rem)] overflow-y-auto">
            <div class="border-b border-slate-100  px-6 py-6 dark:border-navy-700 dark:bg-navy-800">
              <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <span :class="statusPill(selectedOrder.header.statusTone)" class="rounded-full px-3 py-1 text-xs font-semibold">{{ selectedOrder.header.statusLabel }}</span>
                    <span class="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-primary">{{ selectedOrder.header.channelLabel ?? 'Canal direto' }}</span>
                    <span v-for="tag in selectedOrder.header.customerTags" :key="tag" class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100">{{ tag }}</span>
                  </div>
                  <h2 class="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-navy-50">Pedido #{{ selectedOrder.number }}</h2>
                  <p class="mt-2 text-sm text-slate-500 dark:text-navy-300">{{ selectedOrder.header.customerName }} | {{ selectedOrder.header.createdAtRelative }} | {{ formatDateTime(selectedOrder.header.createdAt) }}</p>
                </div>
                <div class="rounded-3xl bg-slate-950 px-6 py-5 text-white shadow-lg dark:bg-primary">
                  <p class="text-xs uppercase tracking-[0.24em] text-white/60">Valor total</p>
                  <p class="mt-2 text-4xl font-black">{{ formatCurrency(selectedOrder.header.totalInCents) }}</p>
                </div>
              </div>
            </div>

            <div class="grid gap-5 px-6 py-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div class="space-y-5">
                <article class="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-navy-600 dark:bg-navy-900/40">
                  <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-navy-400">Cliente</h3>
                    <div class="flex flex-wrap gap-2">
                      <span v-for="tag in selectedOrder.customer.tags" :key="tag" class="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 shadow-sm dark:bg-navy-700 dark:text-navy-100">{{ tag }}</span>
                    </div>
                  </div>
                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <p class="text-lg font-semibold text-slate-900 dark:text-navy-50">{{ selectedOrder.customer.name }}</p>
                      <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">{{ selectedOrder.customer.documentType ?? 'Documento' }} {{ selectedOrder.customer.document ?? '--' }}</p>
                      <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">{{ selectedOrder.customer.email ?? 'Sem email' }}</p>
                      <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">{{ selectedOrder.customer.phone ?? 'Sem telefone' }}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                      <MetricCard label="Pedidos 30d" :value="String(selectedOrder.customer.ordersLast30Days)" />
                      <MetricCard label="Ticket medio" :value="formatCurrency(selectedOrder.customer.averageTicketInCents)" />
                      <MetricCard label="Ultima compra" :value="relativeOrDash(selectedOrder.customer.lastPurchaseAt)" />
                      <MetricCard label="Total pedidos" :value="selectedOrder.customer.totalOrders == null ? '--' : String(selectedOrder.customer.totalOrders)" />
                    </div>
                  </div>
                </article>

                <article class="rounded-3xl border border-slate-200 bg-white p-5 dark:border-navy-600 dark:bg-navy-800">
                  <h3 class="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-navy-400">Deliveries</h3>
                  <div class="space-y-3">
                    <div v-for="delivery in selectedOrder.deliveries" :key="delivery.id ?? delivery.addressLabel ?? delivery.shippingLabel" class="rounded-2xl border border-slate-200 p-4 dark:border-navy-600">
                      <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div class="flex items-center gap-2">
                            <span :class="deliveryStatusPill(delivery.statusCode)" class="rounded-full px-2.5 py-1 text-[11px] font-semibold">{{ delivery.statusLabel }}</span>
                            <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-navy-700 dark:text-navy-100">{{ delivery.shippingLabel }}</span>
                          </div>
                          <p class="mt-3 text-sm font-medium text-slate-900 dark:text-navy-50">{{ delivery.addressLabel ?? 'Sem endereco' }}</p>
                          <p class="mt-1 text-xs text-slate-500 dark:text-navy-300">{{ delivery.warehouseName ?? 'Sem deposito' }}<span v-if="delivery.vendorName"> | {{ delivery.vendorName }}</span></p>
                        </div>
                        <div class="text-sm text-slate-500 dark:text-navy-300">
                          <p>Prazo: {{ formatDateTime(delivery.estimatedAt) || 'A definir' }}</p>
                          <p class="mt-1">Frete: {{ formatCurrency(delivery.shippingPriceInCents) }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                <article class="rounded-3xl border border-slate-200 bg-white p-5 dark:border-navy-600 dark:bg-navy-800">
                  <h3 class="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-navy-400">Produtos</h3>
                  <div class="space-y-5">
                    <div v-for="group in selectedOrder.productGroups" :key="group.groupKey">
                      <div class="mb-3 flex items-center justify-between">
                        <p class="text-sm font-semibold text-slate-900 dark:text-navy-50">{{ group.title }}</p>
                        <span class="text-xs text-slate-400 dark:text-navy-400">{{ group.items.length }} itens</span>
                      </div>
                      <div class="space-y-3">
                        <div v-for="item in group.items" :key="item.id" class="flex items-start gap-4 rounded-2xl border border-slate-200 p-4 dark:border-navy-600">
                          <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-lg font-bold text-slate-400 dark:bg-navy-700 dark:text-navy-200">
                            <template v-if="item.imageUrl && isRenderableImage(item.imageUrl)">
                              <img :src="item.imageUrl" :alt="item.name" class="h-full w-full rounded-2xl object-cover" />
                            </template>
                            <template v-else>
                              {{ item.name.slice(0, 1).toUpperCase() }}
                            </template>
                          </div>
                          <div class="min-w-0 flex-1">
                            <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                              <div>
                                <p class="text-sm font-semibold text-slate-900 dark:text-navy-50">{{ item.name }}</p>
                                <p v-if="item.variantName" class="mt-1 text-xs text-slate-500 dark:text-navy-300">{{ item.variantName }}</p>
                                <p v-if="item.variationSummary" class="mt-1 text-xs text-slate-400 dark:text-navy-400">{{ item.variationSummary }}</p>
                              </div>
                              <div class="text-right text-sm text-slate-700 dark:text-navy-100">
                                <p class="font-semibold">{{ formatCurrency(item.subtotalInCents) }}</p>
                                <p class="mt-1 text-xs text-slate-400 dark:text-navy-400">{{ item.quantity ?? 0 }} x {{ formatCurrency(item.unitPriceInCents) }}</p>
                              </div>
                            </div>
                            <div v-if="item.tags.length" class="mt-3 flex flex-wrap gap-2">
                              <span v-for="tag in item.tags" :key="tag" class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-navy-700 dark:text-navy-100">{{ tag }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </div>

              <div class="space-y-5">
                <article class="rounded-3xl border border-slate-200 bg-white p-5 dark:border-navy-600 dark:bg-navy-800">
                  <h3 class="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-navy-400">Financeiro</h3>
                  <div class="space-y-3 text-sm text-slate-600 dark:text-navy-300">
                    <FinanceLine label="Subtotal" :value="formatCurrency(selectedOrder.finance.subtotalInCents)" />
                    <FinanceLine label="Descontos" :value="formatCurrency(selectedOrder.finance.discountsInCents)" negative />
                    <FinanceLine label="Frete" :value="formatCurrency(selectedOrder.finance.shippingInCents)" />
                    <div class="my-3 border-t border-dashed border-slate-200 dark:border-navy-600"></div>
                    <FinanceLine label="Total final" :value="formatCurrency(selectedOrder.finance.totalInCents)" strong />
                    <FinanceLine label="Forma de pagamento" :value="selectedOrder.finance.paymentMethodName ?? 'Nao informado'" />
                    <FinanceLine label="Status pagamento" :value="selectedOrder.finance.paymentStatusLabel ?? 'Pendente'" />
                  </div>
                </article>

                <article class="rounded-3xl border border-slate-200 bg-white p-5 dark:border-navy-600 dark:bg-navy-800">
                  <h3 class="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-navy-400">Order points</h3>
                  <div class="grid grid-cols-3 gap-3 text-center">
                    <PointCard label="Acumulados" :value="selectedOrder.points.accumulated" />
                    <PointCard label="Disponiveis" :value="selectedOrder.points.available" />
                    <PointCard label="Resgate" :value="selectedOrder.points.possibleRedeem" />
                  </div>
                </article>

                <article class="rounded-3xl border border-slate-200 bg-white p-5 dark:border-navy-600 dark:bg-navy-800">
                  <h3 class="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-navy-400">Insights</h3>
                  <div v-if="selectedOrder.insights.length" class="flex flex-wrap gap-2">
                    <span v-for="insight in selectedOrder.insights" :key="insight.code" :class="insightPill(insight.tone)" class="rounded-full px-3 py-1.5 text-xs font-semibold">{{ insight.label }}</span>
                  </div>
                  <p v-else class="text-sm text-slate-400 dark:text-navy-400">Sem insights disponiveis para este pedido.</p>
                </article>

                <article class="rounded-3xl border border-slate-200 bg-white p-5 dark:border-navy-600 dark:bg-navy-800">
                  <h3 class="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-navy-400">Timeline</h3>
                  <div v-if="selectedOrder.timeline.length" class="space-y-4">
                    <div v-for="event in selectedOrder.timeline" :key="`${event.code}-${event.happenedAt}`" class="flex gap-3">
                      <div class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary"></div>
                      <div>
                        <p class="text-sm font-semibold text-slate-900 dark:text-navy-50">{{ event.label }}</p>
                        <p class="mt-1 text-xs text-slate-500 dark:text-navy-300">{{ formatDateTime(event.happenedAt) || 'Data indefinida' }}</p>
                        <p v-if="event.description" class="mt-1 text-xs text-slate-400 dark:text-navy-400">{{ event.description }}</p>
                      </div>
                    </div>
                  </div>
                  <p v-else class="text-sm text-slate-400 dark:text-navy-400">Sem eventos registrados.</p>
                </article>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'
import { defineComponent, h, onMounted, reactive, ref, watch } from 'vue'
import { useOrdersApi, type OrderDetail, type OrderListItem } from '../composables/useOrdersApi'

const api = useOrdersApi()

const filters = reactive({
  q: '',
  status: '',
  channel: '',
})

const orders = ref<OrderListItem[]>([])
const page = reactive({
  number: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
})
const listLoading = ref(false)
const detailLoading = ref(false)
const selectedOrderId = ref<string | null>(null)
const selectedOrder = ref<OrderDetail | null>(null)

const MetricCard = defineComponent({
  props: { label: { type: String, required: true }, value: { type: String, required: true } },
  setup(props) {
    return () => h('div', { class: 'rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-navy-600 dark:bg-navy-700' }, [
      h('p', { class: 'text-[11px] uppercase tracking-[0.14em] text-slate-400 dark:text-navy-400' }, props.label),
      h('p', { class: 'mt-2 text-sm font-semibold text-slate-900 dark:text-navy-50' }, props.value),
    ])
  },
})

const PointCard = defineComponent({
  props: { label: { type: String, required: true }, value: { type: Number, required: true } },
  setup(props) {
    return () => h('div', { class: 'rounded-2xl bg-slate-50 px-3 py-4 dark:bg-navy-700' }, [
      h('p', { class: 'text-[11px] uppercase tracking-[0.14em] text-slate-400 dark:text-navy-400' }, props.label),
      h('p', { class: 'mt-2 text-2xl font-black text-slate-900 dark:text-navy-50' }, String(props.value)),
    ])
  },
})

const FinanceLine = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
    negative: { type: Boolean, default: false },
    strong: { type: Boolean, default: false },
  },
  setup(props) {
    return () => h('div', { class: 'flex items-center justify-between gap-4' }, [
      h('span', { class: props.strong ? 'font-semibold text-slate-900 dark:text-navy-50' : '' }, props.label),
      h('span', { class: [props.strong ? 'font-bold text-slate-900 dark:text-navy-50' : '', props.negative ? 'text-error' : ''] }, props.negative && props.value !== 'R$ 0,00' ? `- ${props.value}` : props.value),
    ])
  },
})

function formatCurrency(cents?: number | null) {
  return ((cents ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDateTime(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function relativeOrDash(value?: string | null) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  const diffMinutes = Math.max(Math.floor((Date.now() - date.getTime()) / 60000), 0)
  if (diffMinutes < 1) return 'agora'
  if (diffMinutes < 60) return `ha ${diffMinutes}min`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `ha ${diffHours}h`
  return `ha ${Math.floor(diffHours / 24)}d`
}

function recurringLabel(count: number) {
  if (count <= 0) return 'Nenhum pedido recente'
  if (count === 1) return '1 pedido nos ultimos 30 dias'
  return `${count} pedidos nos ultimos 30 dias`
}

function statusPill(tone?: string | null) {
  return {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    danger: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    primary: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  }[tone ?? 'warning'] ?? 'bg-slate-100 text-slate-700 dark:bg-navy-700 dark:text-navy-100'
}

function insightPill(tone?: string | null) {
  return statusPill(tone ?? 'primary')
}

function deliveryStatusPill(statusCode?: string | null) {
  if (statusCode === 'delivered') return statusPill('success')
  if (statusCode === 'shipped' || statusCode === 'in_fulfillment') return statusPill('info')
  if (statusCode === 'failed') return statusPill('danger')
  return statusPill('warning')
}

function isRenderableImage(value: string) {
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')
}

async function fetchOrders() {
  listLoading.value = true
  try {
    const res = await api.listOrders({
      page: page.number,
      size: page.size,
      q: filters.q || undefined,
      status: filters.status || undefined,
      channel: filters.channel || undefined,
    })
    const payload = res.data.data
    orders.value = payload?.content ?? []
    page.totalElements = payload?.totalElements ?? 0
    page.totalPages = payload?.totalPages ?? 0

    if (!selectedOrderId.value && orders.value.length > 0) {
      await selectOrder(orders.value[0].id)
      return
    }

    if (selectedOrderId.value && !orders.value.some(order => order.id === selectedOrderId.value)) {
      selectedOrderId.value = null
      selectedOrder.value = null
    }
  } finally {
    listLoading.value = false
  }
}

async function selectOrder(orderId: string) {
  selectedOrderId.value = orderId
  detailLoading.value = true
  try {
    const res = await api.getOrder(orderId)
    selectedOrder.value = res.data.data
  } finally {
    detailLoading.value = false
  }
}

watch(() => [filters.status, filters.channel], async () => {
  page.number = 0
  await fetchOrders()
})

watch(() => filters.q, async () => {
  page.number = 0
  await fetchOrders()
})

onMounted(fetchOrders)
</script>
