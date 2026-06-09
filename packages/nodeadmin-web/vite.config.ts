import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

/**
 * Vite 配置
 * - base: '/admin/' 与后端反向代理 / nginx 路径一致
 * - 路径别名 @ 指向 src
 * - Element Plus 按需自动导入（不全局引入）
 */
export default defineConfig({
  base: '/admin/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // 后端 API 代理
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // 上传文件静态资源代理
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
