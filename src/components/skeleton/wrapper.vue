<script lang="ts" setup>
    import {vAutoAnimate} from "@formkit/auto-animate";
    import { ref } from 'vue'

    const props = defineProps<{
        loading: boolean;
        quantity: number | string;
        className?: string;
    }>();

    const quantity = ref(props.quantity || 1);
    const className = ref(props.className || '');
</script>

<template>
    <div v-auto-animate>
        <div class="div" v-if="loading" :class="className">
            <slot name="skeleton" v-for="n in quantity" :key="n"/>
        </div>
        <slot v-if="!loading"></slot>
    </div>
</template>

<style scoped>

</style>
