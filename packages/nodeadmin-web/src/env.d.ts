/**
 * 环境变量与 Vue 模块类型声明
 * 确保 TypeScript 正确识别 .vue 文件和 Vite 环境变量
 */

/// <reference types="vite/client" />

/** Vue 单文件组件模块声明 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

/** Vite 环境变量类型扩展 */
interface ImportMetaEnv {
  /** API 基础地址 */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}