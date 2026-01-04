<template>

  <Vue3EasyDataTable :headers="newHeaders" :items="diffItems">
    <template #item-select="{ id }">
      <input name="item[]" type="checkbox" :value="id" class="select checkbox" v-model="selected" :true-value="[]"/>
    </template>
  </Vue3EasyDataTable>
  <div class="col-12 m-2" v-if="addToList">
    <button class="btn btn-primary" type="button" @click="addToListRequest">{{ $t("app.addToList") }}</button>
  </div>

</template>
<script lang="ts">
import Vue3EasyDataTable from "vue3-easy-data-table"
import {defineComponent} from "vue";

export default defineComponent({
  name: 'ItemsTable',
  data() {
    return {
      selectAllItems: false,
      selected: [],
    }
  },
  methods: {
    async addToListRequest() {
      if (this.selected.length > 0) {
        let data = {
          items: this.selected
        }
        await this.$axios.post(this.updateUrl, data).then(() => {
          this.$emit('addToList', true)
        }).catch((error: any) => {
          console.error(error)
        })
      }
    },
  },
  components: {Vue3EasyDataTable},
  props: {
    diffItems: {},
    newHeaders: {},
    addToList: {
      type: Boolean,
      default: false
    },
    updateUrl: {
      type: String,
      default: ''
    },
  },
  watch: {
    selectAllItems(val) {
      if (val) {
        // select all
        //get all checkboxes
        let checkboxes = document.getElementsByClassName('select')
        for (let i = 0; i < checkboxes.length; i++) {
          (checkboxes[i] as any).checked = true
        }
      } else {
        // deselect all
        //get all checkboxes
        let checkboxes = document.getElementsByClassName('select')
        for (let i = 0; i < checkboxes.length; i++) {
          (checkboxes[i] as any) = false
        }
      }
    }
  },
})
</script>