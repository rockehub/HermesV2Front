<script setup lang="ts">

import {Field} from "vee-validate";
</script>

<template>
  <Field v-model="form[field.name]" :name="field.name" :label="field.label" :rules="fieldRules(field)"
         @blur="actionBlur(field)">
    <template #default="{ field: veeField,errors, valid, }">

      <label class="block">
        <input
            class="form-input w-full rounded-lg border  bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
            v-bind="veeField"
            :type="field.type"
            :id="field.name"
            :checked="field.checked"
            :class="{'border-error': errors[0],'border-success':valid,'form-check-input': field.type === 'checkbox' }"
            :disabled="field.disabled"
        />
      </label>

    </template>
  </Field>
</template>

<style scoped>

</style>