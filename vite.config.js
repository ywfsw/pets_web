// (这是 vite.config.js 的完整内容)

import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],

  // (❗❗❗ 核心修复 ❗❗❗)
  // 添加 'resolve.alias' 配置
  resolve: {
    alias: {
      // (这行代码告诉 Vite, '@' 就等于 './src' 目录)
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
