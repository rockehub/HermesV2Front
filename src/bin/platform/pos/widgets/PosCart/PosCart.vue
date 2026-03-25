<script lang="ts" setup>
import { usePosStore } from '../../store/usePosStore'
import { useAuthStore } from '@/stores/auth'
import { ref, nextTick } from 'vue'

const posStore = usePosStore()
const authStore = useAuthStore()
const canChangePrice = authStore.roles.includes('pos:price:change') || authStore.isAdmin
const canApplyDiscount = authStore.roles.includes('pos:discount:apply') || authStore.isAdmin

const discountCode = ref('')
const applyingDiscount = ref(false)

const editingPriceId = ref<string | null>(null)
const tempPrice = ref('')

async function startEditPrice(line: any) {
  editingPriceId.value = line.id
  tempPrice.value = (line.pricePostTaxes / 100).toFixed(2).replace('.', ',')
  await nextTick()
  const el = document.querySelector<HTMLInputElement>(`[data-price-input="${line.id}"]`)
  el?.focus()
  el?.select()
}

async function confirmEditPrice(line: any) {
  const cents = Math.round(parseFloat(tempPrice.value.replace(',', '.')) * 100)
  if (!isNaN(cents) && cents > 0 && cents !== line.pricePostTaxes) {
    await posStore.updateItem(line.id, line.quantity, cents)
  }
  editingPriceId.value = null
}

async function applyDiscount() {
  if (!discountCode.value.trim()) return
  applyingDiscount.value = true
  try {
    await posStore.applyDiscountCode(discountCode.value.trim())
    discountCode.value = ''
  } catch {
    // handled by store
  } finally {
    applyingDiscount.value = false
  }
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>

<template>
  <div class="flex h-full flex-col bg-white dark:bg-navy-750 rounded-lg overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-100 dark:border-navy-700 px-4 py-3">
      <h3 class="text-sm font-semibold text-slate-700 dark:text-navy-100">
        <em class="fa-light fa-cart-shopping mr-2 text-primary"></em>
        Carrinho
        <span v-if="posStore.hasItems" class="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] text-white">
          {{ posStore.cart?.entriesCount }}
        </span>
      </h3>
      <button
        v-if="posStore.hasItems"
        class="text-xs text-slate-400 hover:text-error transition-colors"
        title="Limpar carrinho"
        @click="posStore.newSale()"
      >
        <em class="fa-light fa-trash"></em>
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="!posStore.hasItems" class="flex flex-1 flex-col items-center justify-center text-slate-400 dark:text-navy-400 p-6">
      <em class="fa-light fa-cart-shopping text-4xl mb-3 opacity-30"></em>
      <p class="text-sm">Carrinho vazio</p>
    </div>

    <!-- Lines -->
    <div v-else class="flex-1 overflow-y-auto is-scrollbar-hidden">
      <div
        v-for="line in posStore.cart?.lines"
        :key="line.id"
        class="group flex items-start gap-3 border-b border-slate-50 dark:border-navy-700 px-4 py-2.5"
      >
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-slate-700 dark:text-navy-100 truncate">{{ line.name }}</p>
          <p v-if="line.variantName" class="text-[10px] text-slate-400 truncate">{{ line.variantName }}</p>
          <p
            v-if="line.propertiesDescription && line.propertiesDescription !== line.variantName"
            class="text-[10px] text-slate-400 truncate"
          >
            {{ line.propertiesDescription }}
          </p>
          <p class="text-[11px] text-slate-500 dark:text-navy-300 mt-0.5 flex items-center gap-1 flex-wrap">
            <template v-if="canChangePrice && editingPriceId === line.id">
              <input
                :data-price-input="line.id"
                v-model="tempPrice"
                type="text"
                inputmode="decimal"
                class="w-16 rounded border border-primary px-1 py-0.5 text-[11px] text-slate-700 dark:text-navy-100 bg-white dark:bg-navy-700 focus:outline-none"
                @blur="confirmEditPrice(line)"
                @keydown.enter.prevent="confirmEditPrice(line)"
                @keydown.escape="editingPriceId = null"
              />
            </template>
            <template v-else>
              <span
                :title="canChangePrice ? 'Clique para alterar o preço' : ''"
                :class="canChangePrice ? 'cursor-pointer hover:text-primary hover:underline underline-offset-2' : ''"
                @click="canChangePrice && startEditPrice(line)"
              >{{ formatCurrency(line.pricePostTaxes) }}</span>
            </template>
            × {{ line.quantity }} =
            <span class="font-medium text-slate-700 dark:text-navy-100">{{ formatCurrency(line.totalPostTaxes) }}</span>
          </p>
        </div>

        <!-- Qty controls -->
        <div class="flex items-center gap-1 shrink-0">
          <button
            class="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-navy-600 text-slate-500 hover:bg-slate-200 dark:hover:bg-navy-500 transition-colors text-xs"
            @click="posStore.updateItem(line.id, line.quantity - 1)"
          >
            <em class="fa-solid fa-minus text-[8px]"></em>
          </button>
          <span class="w-6 text-center text-xs font-medium text-slate-700 dark:text-navy-100">{{ line.quantity }}</span>
          <button
            class="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-navy-600 text-slate-500 hover:bg-slate-200 dark:hover:bg-navy-500 transition-colors text-xs"
            @click="posStore.updateItem(line.id, line.quantity + 1)"
          >
            <em class="fa-solid fa-plus text-[8px]"></em>
          </button>
          <button
            class="ml-1 flex h-6 w-6 items-center justify-center rounded-md text-slate-300 hover:bg-error/10 hover:text-error transition-colors opacity-0 group-hover:opacity-100 text-xs"
            @click="posStore.removeItem(line.id)"
          >
            <em class="fa-solid fa-times text-[9px]"></em>
          </button>
        </div>
      </div>
    </div>

    <!-- Discount code -->
    <div v-if="posStore.hasItems && canApplyDiscount" class="border-t border-slate-100 dark:border-navy-700 px-4 py-2">
      <div class="flex gap-2">
        <input
          v-model="discountCode"
          type="text"
          placeholder="Código de desconto"
          class="form-input h-8 flex-1 text-xs rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 text-slate-700 dark:text-navy-100 placeholder:text-slate-400"
          @keydown.enter="applyDiscount"
        />
        <button
          class="flex h-8 items-center rounded-lg bg-primary/10 px-3 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          :disabled="applyingDiscount || !discountCode.trim()"
          @click="applyDiscount"
        >
          Aplicar
        </button>
      </div>
      <div v-if="posStore.cart?.appliedDiscounts?.length" class="mt-1.5 flex flex-wrap gap-1">
        <span
          v-for="d in posStore.cart.appliedDiscounts"
          :key="d.code"
          class="rounded bg-success/10 px-2 py-0.5 text-[10px] text-success"
        >
          {{ d.code }} -{{ d.discountPercentage ?? d.discountAmount }}
        </span>
      </div>
    </div>

    <!-- Totals -->
    <div v-if="posStore.hasItems" class="border-t border-slate-200 dark:border-navy-700 px-4 py-3 space-y-1.5">
      <div v-if="posStore.cart!.totalDiscounts > 0" class="flex justify-between text-xs text-success">
        <span>Desconto</span>
        <span>-{{ formatCurrency(posStore.cart!.totalDiscounts) }}</span>
      </div>
      <div class="flex justify-between text-sm font-semibold text-slate-700 dark:text-navy-100">
        <span>Total</span>
        <span>{{ formatCurrency(posStore.cartTotal) }}</span>
      </div>
    </div>
  </div>
</template>
