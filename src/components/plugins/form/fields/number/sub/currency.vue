<template>
  <div class="currency-input-container">
    <!-- Campo de entrada -->
    <input ref="inputRef" type="number" v-bind="field" class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent" />
  </div>
</template>

<script lang="ts" setup>
import type { BaseFieldProps, NumberFieldSchema } from '@/classes/form/schemas'
import type { RegisteredField } from '@/classes/form/FieldRegistry'

const props = defineProps<BaseFieldProps<RegisteredField<'number'>>>()
</script>

<style scoped>
.currency-input-container {
  display: flex;
  align-items: center;
  position: relative;
}

.currency-button {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-right: none;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  border-radius: 4px 0 0 4px;
}

.currency-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100px;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.currency-dropdown ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.currency-dropdown li {
  padding: 0.5rem;
  cursor: pointer;
}

.currency-dropdown li:hover {
  background-color: #f0f0f0;
}

.currency-input {
  flex: 1;
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-left: none;
  border-radius: 0 4px 4px 0;
}
</style>
