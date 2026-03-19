<template>
  <div>
    <!-- Trigger Button -->
    <slot name="button" :openModal="openModal" v-if="!noButton">
      <button
        type="button"
        class="btn bg-slate-150 font-medium text-slate-800 hover:bg-slate-200 focus:bg-slate-200 active:bg-slate-200/80 dark:bg-navy-500 dark:text-navy-50 dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90"
        @click="openModal"
      >
        <slot name="trigger">Open Modal</slot>
      </button>
    </slot>

    <!-- Modal Container -->
    <teleport to="body">
      <TransitionRoot appear :show="isOpen" as="template">
        <div
          class="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5"
          role="dialog"
          @keydown.esc="closeModal"
        >
          <!-- Overlay/Backdrop -->
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="ease-in duration-200"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <div
              class="absolute inset-0 bg-slate-900/60 transition-opacity duration-300"
              :class="{ 'backdrop-blur': backdropBlur }"
              @click="closeModal"
            />
          </TransitionChild>

          <!-- Modal Panel -->
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <div
              :class="[
                'scrollbar-sm relative flex flex-col overflow-y-auto rounded-lg bg-white transition-all duration-300 dark:bg-navy-700',
                modalSize,
                centered ? 'text-center px-4 py-10 sm:px-5' : 'px-4 pb-4 sm:px-5'
              ]"
            >
              <!-- Close Button (opcional) -->
              <button
                v-if="showCloseButton && !centered"
                @click="closeModal"
                class="btn -mr-1.5 h-7 w-7 rounded-full p-0 hover:bg-slate-300/20 focus:bg-slate-300/20 active:bg-slate-300/25 dark:hover:bg-navy-300/20 dark:focus:bg-navy-300/20 dark:active:bg-navy-300/25 self-end my-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4.5 w-4.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <!-- Icon Section -->
              <div v-if="icon" :class="centered ? '' : 'flex items-center justify-center'">
                <slot name="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    :class="[
                      centered ? 'mx-auto inline h-28 w-28 shrink-0' : 'h-16 w-16',
                      iconColor
                    ]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </slot>
              </div>

              <!-- Content Section -->
              <div :class="icon && centered ? 'mt-4' : ''">
                <slot name="content">
                  <div>
                    <h2
                      class="text-2xl text-slate-700 dark:text-navy-100"
                      :class="{ 'text-center': centered }"
                    >
                      Default Title
                    </h2>
                    <p
                      class="mt-2 text-slate-500 dark:text-navy-200"
                      :class="{ 'text-center': centered }"
                    >
                      Default content goes here. You can replace this with your own content.
                    </p>
                  </div>
                </slot>
              </div>

              <!-- Divider (opcional) -->
              <div
                v-if="showDivider && !noFooter"
                class="my-4 h-px bg-slate-200 dark:bg-navy-500"
              ></div>

              <!-- Footer Section -->
              <div
                v-if="!noFooter"
                :class="[
                  'flex items-center',
                  centered ? 'justify-center space-x-3' : 'justify-end space-x-2 mt-4'
                ]"
              >
                <slot name="footer">
                  <button
                    type="button"
                    :class="[
                      'btn font-medium',
                      centered
                        ? 'min-w-[7rem] rounded-full border border-slate-300 text-slate-800 hover:bg-slate-150 focus:bg-slate-150 active:bg-slate-150/80 dark:border-navy-450 dark:text-navy-50 dark:hover:bg-navy-500 dark:focus:bg-navy-500 dark:active:bg-navy-500/90'
                        : 'rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-150 focus:bg-slate-150 active:bg-slate-150/80 dark:border-navy-450 dark:text-navy-100 dark:hover:bg-navy-500 dark:focus:bg-navy-500 dark:active:bg-navy-500/90'
                    ]"
                    @click="closeModal"
                  >
                    <slot name="cancel-button">{{ t('modal.cancel') }}</slot>
                  </button>

                  <slot name="confirm-button" :confirm="confirmCallback">
                    <button
                      v-if="confirmCallback"
                      type="button"
                      :class="[
                        'btn font-medium text-white',
                        centered
                          ? 'min-w-[7rem] rounded-full bg-primary hover:bg-primary-focus focus:bg-primary-focus active:bg-primary-focus/90 dark:bg-accent dark:hover:bg-accent-focus dark:focus:bg-accent-focus dark:active:bg-accent/90'
                          : 'rounded-lg bg-primary hover:bg-primary-focus focus:bg-primary-focus active:bg-primary-focus/90 dark:bg-accent dark:hover:bg-accent-focus dark:focus:bg-accent-focus dark:active:bg-accent/90'
                      ]"
                      @click="confirmCallbackInternal"
                    >
                      {{ t('modal.confirm') }}
                    </button>
                  </slot>
                </slot>
              </div>
            </div>
          </TransitionChild>
        </div>
      </TransitionRoot>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { TransitionRoot, TransitionChild } from '@headlessui/vue'
import { useI18n } from 'vue-i18n'

interface Props {
  confirmCallback?: Function
  icon?: boolean
  noButton?: boolean
  noFooter?: boolean
  centered?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  iconColor?: string
  backdropBlur?: boolean
  showCloseButton?: boolean
  showDivider?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  centered: true,
  size: 'lg',
  iconColor: 'text-success',
  backdropBlur: false,
  showCloseButton: false,
  showDivider: false
})

const isOpen = ref(false)
const emit = defineEmits(['afterEmit', 'onClosed'])
const { t } = useI18n()

const modalSize = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }
  return sizes[props.size] || sizes.lg
})

const openModal = () => {
  isOpen.value = true
  emit('afterEmit')
}

const confirmCallbackInternal = () => {
  if (props.confirmCallback) {
    props.confirmCallback()
  }
}

const closeModal = () => {
  emit('onClosed')
  isOpen.value = false
}

defineExpose({
  closeModal,
  openModal
})
</script>

<style scoped>
/* Estilos adicionais se necessário */
</style>
