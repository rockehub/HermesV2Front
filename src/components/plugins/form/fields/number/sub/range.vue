<script setup lang="ts">
    import type { BaseFieldProps, NumberFieldSchema } from '@/classes/form/schemas';
    import { useI18n } from 'vue-i18n'
    import { computed } from 'vue'
    import type { RegisteredField } from '@/classes/form/FieldRegistry'

    const props = defineProps<BaseFieldProps<RegisteredField<'number'>>>();

    const { t } = useI18n();
    const label = computed(() => {
        return t(props.params.config.label);
    });
</script>

<template>
    <input type="range" v-bind="field" class="form-range w-full text-primary dark:text-accent" :min="params.config.min" :max="params.config.max"
           :placeholder="t('form.commons.placeholder', {field: label })" />

</template>

<style scoped>

</style>
