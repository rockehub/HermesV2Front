<template>
  <Tabs :options="{ useUrlFragment: false }">
    <Tab :name="$t(tab.tab)" v-for="tab in tabs" :key="tab.tab">
      <FormGenerator :form-schema="tab.fields" :initial-values="initialValues" @onSubmit="onSubmit"/>
    </Tab>
  </Tabs>
</template>

<script lang="ts" setup>
import {Tabs, Tab} from 'vue3-tabs-component';
import FormGenerator from "./FormGenerator.vue";

defineProps<{
  tabs: {
    type: Array,
    default: () => []
  },
  initialValues: {
    type: Object,
    default: () => {}
  }
}>()

const onSubmit = (form: any) => {
  this.$emit('onSubmit', form)
}


</script>
<style scoped>

</style>