<script setup lang="ts">
    import type { OptionsPropsSchema } from '@/classes/form/schemas';
    import { useI18n } from 'vue-i18n'

    const { t } = useI18n();
    const props = defineProps<OptionsPropsSchema>();
</script>

<template>
    <div>
        <input :list="`list-${params.code}`" class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent" :size="params.size"  :multiple="params.multiple"/>
        <datalist :id="`list-${params.code}`">
            <option v-for="option in options" :value="option.name" :key="option.name" />
        </datalist>
    </div>
</template>

<style scoped>
</style>
