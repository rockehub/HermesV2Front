<script setup lang="ts">
    import type { OptionsPropsSchema } from '@/classes/form/schemas';
    import { Field } from 'vee-validate';
    import { useI18n } from 'vue-i18n'

    const { t } = useI18n();
    const props = defineProps<OptionsPropsSchema>();
</script>

<template>
    <div v-for="option in options" :key="option.name">
        <label class="inline-flex items-center space-x-2">
            <Field
                type="radio"
                :name="params.code"
                class="form-radio is-basic h-5 w-5 rounded-full border-slate-400/70 checked:border-primary checked:bg-primary hover:border-primary focus:border-primary dark:border-navy-400 dark:checked:border-accent dark:checked:bg-accent dark:hover:border-accent dark:focus:border-accent"
                :value="option.id"
                :unchecked-value="false"
            />
            <span>{{ option.name }}</span>
        </label>
    </div>
</template>

<style scoped>
</style>
