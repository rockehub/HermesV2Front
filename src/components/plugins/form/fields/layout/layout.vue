<script setup lang="ts">
    import type { BaseFieldProps, LayoutFieldSchema } from '@/classes/form/schemas';
    import { useI18n } from 'vue-i18n'
    import type { RegisteredField } from '@/classes/form/FieldRegistry'

    const { t } = useI18n();
    const props = defineProps<BaseFieldProps<RegisteredField<'layout'>>>();
</script>

<template>
    <section v-if="params.config.type == 'section'">
        <div class="border-b border-slate-200 dark:border-navy-500 pb-2 pt-1">
            <h4 class="text-slate-700 dark:text-navy-100 font-medium leading-tight mb-2 mt-0 text-lg" v-if="params.config.title">
                {{ t(params.config.title) }}</h4>
            <p class="text-slate-400 dark:text-navy-300 text-sm mt-1" v-if="params.config.description">{{ t(params.config.description) }}</p>
        </div>
    </section>
    <hr v-if="params.config.type == 'line'" class="border-slate-200 dark:border-navy-500">
</template>

<style scoped>

</style>
