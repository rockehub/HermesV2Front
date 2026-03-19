<script setup lang="ts">
    import type { BaseFieldProps, TextareaFieldSchema } from '@/classes/form/schemas';

    const props = defineProps<BaseFieldProps<TextareaFieldSchema>>();
    const fieldValue = ref([]);

    import { useField } from 'vee-validate';
    import { ref, watch } from 'vue'
    import Editor from '@/components/plugins/form/fields/textarea/sub/editor.vue'

    const { value, setValue } = useField(props.params.code);

    watch(() => fieldValue.value, (value) => {
        setValue(value);
    });
</script>

<template>
    <div class="relative mb-5">
    <editor v-model="fieldValue" :params="params" :field="field"
                                     :initialValues="initialValues"  :schema="schema" />
    </div>
</template>

<style scoped>

</style>
