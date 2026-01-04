<script setup lang="ts">

import {Field} from "vee-validate";
</script>

<template>
  <Field v-model="form[field.name]" :name="field.name" :label="field.label">
    <template #default="{ field: veeField,errors, valid, }">
      <label class="inline-flex items-center space-x-2">
        <input
            class="form-checkbox is-basic h-5 w-5 rounded border-slate-400/70 checked:bg-primary checked:border-primary hover:border-primary focus:border-primary dark:border-navy-400 dark:checked:bg-accent dark:checked:border-accent dark:hover:border-accent dark:focus:border-accent"
            v-bind="veeField"
            :type="field.type"
            :id="field.name"
            :class="{'border-error': errors[0],'border-success':valid }"
            :checked="field.checked"
        />
        <span>Primary</span>
      </label>
    </template>
  </Field>
</template>

<style scoped>

</style>