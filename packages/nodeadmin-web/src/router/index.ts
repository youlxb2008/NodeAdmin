import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import { setupGuards, setAuthenticated, registerDynamicRoutes, resetDynamicRoutes } from './guard'

/**
 * Vue Router 实例
 *
 * 使用 HTML5 History 模式，base = '/admin/' 与 Vite base 保持一致。
 */
const router = createRouter({
  history: createWebHistory('/admin/'),
  routes,
})

// 注册全局守卫
setupGuards(router)

export default router
export { setAuthenticated, registerDynamicRoutes, resetDynamicRoutes }
