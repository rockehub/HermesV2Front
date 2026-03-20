<template>
  <DefaultLayout :icon="{ type: 'fa', icon: 'fa-light fa-truck-fast text-[1.2rem]' }" :menu-items="[]">
    <div class="min-h-screen bg-slate-100 px-6 py-6 dark:bg-navy-900">
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 dark:border-navy-600 dark:bg-navy-800 dark:text-navy-100" type="button" @click="goBack">
            <em class="fa-light fa-arrow-left"></em>
            Voltar para pedidos
          </button>
          <p class="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-navy-400">Deliveries</p>
          <h1 class="mt-2 text-2xl font-semibold text-slate-900 dark:text-navy-50">Pedido #{{ orderDeliveries?.orderNumber ?? '--' }}</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">Painel dedicado para operacao logistica, acompanhamento e atualizacao do fluxo de entrega.</p>
        </div>
        <button class="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-primary dark:hover:bg-primary/90" type="button" @click="loadDeliveries">
          Atualizar
        </button>
      </div>

      <div v-if="errorMessage" class="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
        {{ errorMessage }}
      </div>

      <div v-if="loading && !orderDeliveries" class="flex min-h-[18rem] items-center justify-center">
        <em class="fa-duotone fa-spinner-third fa-spin text-2xl text-primary"></em>
      </div>

      <template v-else-if="orderDeliveries">
        <div class="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
          <section class="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-navy-700 dark:bg-navy-800">
            <div class="border-b border-slate-100 px-6 py-5 dark:border-navy-700">
              <div class="flex flex-wrap items-center gap-3">
                <span :class="statusPill(orderDeliveries.orderStatusCode)" class="rounded-full px-3 py-1 text-xs font-semibold">{{ orderDeliveries.orderStatusLabel }}</span>
                <span class="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-primary">{{ orderDeliveries.customerName }}</span>
              </div>
              <div class="mt-4 grid gap-4 md:grid-cols-2">
                <InfoMetric label="Tracking" :value="orderDeliveries.trackingNumber ?? '--'" />
                <InfoMetric label="Link de rastreio" :value="orderDeliveries.trackingUrl ?? '--'" />
              </div>
            </div>

            <div v-if="orderDeliveries.deliveries.length" class="space-y-5 px-6 py-5">
              <article v-for="delivery in orderDeliveries.deliveries" :key="delivery.id" class="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 dark:border-navy-600 dark:bg-navy-900/40">
                <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <span :class="statusPill(delivery.statusCode)" class="rounded-full px-3 py-1 text-xs font-semibold">{{ delivery.statusLabel }}</span>
                      <span class="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 dark:bg-navy-700 dark:text-navy-100">{{ delivery.shippingLabel }}</span>
                      <span v-if="delivery.selectedShippingProvider" class="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 dark:bg-navy-700 dark:text-navy-100">{{ delivery.selectedShippingProvider }}</span>
                    </div>
                    <h2 class="mt-4 text-xl font-semibold text-slate-900 dark:text-navy-50">{{ delivery.title }}</h2>
                    <p class="mt-2 text-sm text-slate-500 dark:text-navy-300">{{ delivery.addressLabel ?? 'Sem endereco vinculado' }}</p>
                    <p class="mt-1 text-xs text-slate-400 dark:text-navy-400">{{ delivery.warehouseName ?? 'Sem deposito' }}<span v-if="delivery.vendorName"> | {{ delivery.vendorName }}</span></p>
                  </div>

                  <div class="grid gap-3 sm:grid-cols-2 xl:w-[340px]">
                    <InfoMetric label="Frete" :value="formatCurrency(delivery.shippingPriceInCents)" />
                    <InfoMetric label="Codigo do servico" :value="delivery.selectedShippingCode ?? '--'" />
                    <InfoMetric label="NF-e" :value="delivery.nfeRef ?? '--'" />
                    <InfoMetric label="Estado fiscal" :value="delivery.nfeState ?? '--'" />
                  </div>
                </div>

                <div class="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div>
                    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <InfoMetric label="Data selecionada" :value="formatDateTime(delivery.selectedDeliveryDate)" />
                      <InfoMetric label="Estimativa interna" :value="formatDateTime(delivery.deliveryEstimateAt)" />
                      <InfoMetric label="Promessa da entrega" :value="formatDateTime(delivery.promisedDeliveryAt)" />
                      <InfoMetric label="Cotacao do frete" :value="formatDateTime(delivery.quotedDeliveryAt)" />
                      <InfoMetric label="Enviado em" :value="formatDateTime(delivery.sentAt)" />
                      <InfoMetric label="Entregue em" :value="formatDateTime(delivery.deliveredAt)" />
                    </div>

                    <div class="mt-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-navy-600 dark:bg-navy-800">
                      <h3 class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-navy-400">Itens da entrega</h3>
                      <div v-if="delivery.items.length" class="mt-4 space-y-2">
                        <div v-for="item in delivery.items" :key="item.id" class="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-3 py-2 text-sm dark:border-navy-700">
                          <span class="font-medium text-slate-800 dark:text-navy-100">{{ item.name }}</span>
                          <span class="text-slate-500 dark:text-navy-300">x{{ item.quantity ?? 0 }}</span>
                        </div>
                      </div>
                      <p v-else class="mt-4 text-sm text-slate-400 dark:text-navy-400">Sem itens vinculados a esta entrega.</p>
                    </div>
                  </div>

                  <div class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-navy-600 dark:bg-navy-800">
                    <h3 class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-navy-400">Atualizar status</h3>
                    <div class="mt-4 space-y-4">
                      <label class="block">
                        <span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Fluxo da entrega</span>
                        <select v-model="draftByDeliveryId[delivery.id].statusCode" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100">
                          <option v-for="option in orderDeliveries.statusOptions" :key="option.code" :value="option.code">{{ option.label }}</option>
                        </select>
                      </label>

                      <label class="block">
                        <span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Observacao interna</span>
                        <textarea v-model="draftByDeliveryId[delivery.id].review" rows="4" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100"></textarea>
                      </label>

                      <button class="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary dark:hover:bg-primary/90" type="button" :disabled="savingDeliveryId === delivery.id" @click="saveDelivery(delivery.id)">
                        {{ savingDeliveryId === delivery.id ? 'Salvando...' : 'Salvar status da entrega' }}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div v-else class="px-6 py-10 text-center text-sm text-slate-400 dark:text-navy-400">
              Nenhuma entrega foi gerada para este pedido.
            </div>
          </section>

          <section class="space-y-5">
            <article class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-700 dark:bg-navy-800">
              <h3 class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-navy-400">Leitura operacional</h3>
              <div class="mt-4 space-y-3 text-sm text-slate-500 dark:text-navy-300">
                <p>Promessa da entrega: usa a melhor data disponivel entre data selecionada, estimativa interna e cotacao do frete.</p>
                <p>Envio e entrega: quando voce marca como enviado ou entregue, o backend registra as datas operacionais automaticamente.</p>
                <p>Fluxo isolado: esta tela trabalha apenas com a logistica do pedido, sem misturar cliente, financeiro e timeline geral.</p>
              </div>
            </article>
          </section>
        </div>
      </template>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'
import notification from '@/helpers/utils/notification'
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type OrderDeliveriesDetail, useOrdersApi } from '../composables/useOrdersApi'

const api = useOrdersApi()
const route = useRoute()
const router = useRouter()
const toast = notification

const orderId = computed(() => String(route.params.orderId ?? ''))
const loading = ref(false)
const errorMessage = ref('')
const orderDeliveries = ref<OrderDeliveriesDetail | null>(null)
const savingDeliveryId = ref<string | null>(null)
const draftByDeliveryId = reactive<Record<string, { statusCode: string; review: string }>>({})

const InfoMetric = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true }
  },
  setup(props) {
    return () => h('div', { class: 'rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-navy-600 dark:bg-navy-800' }, [
      h('p', { class: 'text-[11px] uppercase tracking-[0.14em] text-slate-400 dark:text-navy-400' }, props.label),
      h('p', { class: 'mt-2 text-sm font-semibold text-slate-900 dark:text-navy-50 break-words' }, props.value || '--')
    ])
  }
})

function statusPill(statusCode?: string | null) {
  const code = statusCode ?? 'pending'
  if (code === 'delivered') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
  if (code === 'shipped' || code === 'in_fulfillment') return 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'
  if (code === 'failed' || code === 'cancelled') return 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
  if (code === 'ready_for_fulfillment') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
  return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
}

function formatCurrency(cents?: number | null) {
  return ((cents ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDateTime(value?: string | null) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function syncDrafts() {
  const next: Record<string, { statusCode: string; review: string }> = {}
  for (const delivery of orderDeliveries.value?.deliveries ?? []) {
    next[delivery.id] = {
      statusCode: delivery.statusCode,
      review: delivery.review ?? ''
    }
  }
  Object.keys(draftByDeliveryId).forEach((key) => delete draftByDeliveryId[key])
  Object.assign(draftByDeliveryId, next)
}

async function loadDeliveries() {
  if (!orderId.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await api.getOrderDeliveries(orderId.value)
    orderDeliveries.value = res.data.data
    syncDrafts()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message ?? 'Falha ao carregar as entregas do pedido.'
    toast({ text: errorMessage.value, variant: 'error' })
  } finally {
    loading.value = false
  }
}

async function saveDelivery(deliveryId: string) {
  const draft = draftByDeliveryId[deliveryId]
  if (!draft) return
  savingDeliveryId.value = deliveryId
  try {
    await api.updateDeliveryStatus(orderId.value, deliveryId, {
      statusCode: draft.statusCode,
      review: draft.review || null
    })
    toast({ text: 'Status da entrega atualizado.', variant: 'success' })
    await loadDeliveries()
  } catch (error: any) {
    const message = error?.response?.data?.message ?? 'Falha ao atualizar o status da entrega.'
    toast({ text: message, variant: 'error' })
  } finally {
    savingDeliveryId.value = null
  }
}

function goBack() {
  router.push({ name: 'orders' })
}

onMounted(loadDeliveries)
</script>
