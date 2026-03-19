<template>
  <teleport to="body">
    <div
        v-if="showModal"
        class="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5 z-[999999]"
        @keydown.esc="closeModal"
    >
      <div
          class="absolute inset-0 bg-slate-900/60 backdrop-blur transition-opacity duration-300"
          @click="closeModal"
      ></div>

      <div
          :class="panel
            ? 'relative w-[90vw] max-w-6xl rounded-xl overflow-hidden bg-white dark:bg-navy-700 transition-opacity duration-300'
            : 'relative min-w-[400px] max-w-lg w-full rounded-lg bg-white px-5 py-8 text-center transition-opacity duration-300 dark:bg-navy-700'"
      >
        <slot></slot>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, defineEmits,watch } from 'vue';

// Props to control modal visibility
const props = defineProps<{ show: boolean; panel?: boolean }>();

// Emits to notify parent component to close the modal
const emit = defineEmits(['update:show']);

const showModal = ref(false);

// Watch the 'show' prop to sync the local state
watch(
    () => props.show,
    (newVal) => {
      showModal.value = newVal;
    }
);

// Method to close the modal
function closeModal() {
  showModal.value = false;
  emit('update:show', false);
}
</script>
