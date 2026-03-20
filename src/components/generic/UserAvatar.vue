<template>
  <component :is="tag" class="avatar" :class="setSize()">
    <img
        class="rounded-full"
        :src="setImage()"
        alt="avatar"
    />

  </component>
</template>
<script lang="ts">
import {defineComponent} from 'vue'
import {useAuthStore} from "@/stores/stores";
import type {User} from "@/helpers/interfaces/IAuth";




export default defineComponent({
  name: 'UserAvatar',
  setup: () => ({auth: useAuthStore()}),
  props: {
    tag: {
      type: String,
      default: 'div'
    },
    size: {
      type: Number,
      default: 12
    },
    contact: {
      type: Object as () => User,
      default: () => ({})
    }
  }, methods: {
    setSize() {
      return 'h-' + this.size + ' w-' + this.size
    },
    setImage() {
      if (this.contact?.image) {
        return this.contact.image
      }
      if (this.auth.user?.image) {
        return this.auth.user.image
      } else {
        return 'https://ui-avatars.com/api/?name=' + this.auth.user?.name + '&background=0D8ABC&color=fff'
      }
    }
  }
})
</script>
