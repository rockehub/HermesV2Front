/// <reference types="vite/client" />
/// <reference types="node" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}

declare module '@bhplugin/vue3-datatable' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

declare module '@vueup/vue-quill' {
  import type { DefineComponent } from 'vue'
  export const QuillEditor: DefineComponent<any, any, any>
}

declare module 'quill-html-edit-button' {
  const htmlEditButton: unknown
  export default htmlEditButton
}
