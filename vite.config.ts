import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Icons({
      autoInstall: true
    }),
    vue(),
    vueJsx(),
    vueDevTools(),
    Components({
      dirs: [
        'src/components',               // Root components directory
        'src/bin/platform/hermes/components',
        'src/bin/**/**/components',            // Match all plugin directories
        'src/bin/**/**/layouts'
      ],
      directoryAsNamespace: true,
      extensions: ['vue'],
      deep: true,  // Search nested directories
      dts: 'src/components.d.ts'       // Optional: TypeScript declaration for auto-imported components
    })
  ],
  define: {
    process: {
      env: process.env

    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
