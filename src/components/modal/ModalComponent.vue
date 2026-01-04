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
          class=" min-w-[600px] relative max-w-[1000px] rounded-lg bg-white px-4 py-10 text-center transition-opacity duration-300 dark:bg-navy-700 sm:px-5"
      >
        <slot></slot>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, defineEmits,watch } from 'vue';

// Props to control modal visibility
const props = defineProps<{ show: boolean }>();

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
