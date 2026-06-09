import type { RouteRecordRaw } from 'vue-router'
import Layout from '../layout/index.vue'

/**
 * 静态路由表
 *
 * - 业务页面（dashboard 之外）由后端菜单驱动，通过 router.addRoute 动态注册
 * - 这里只保留登录、错误页、Layout 容器以及一个 dashboard 占位
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Layout',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        meta: { title: '仪表盘' },
        component: () => import('../views/dashboard/index.vue'),
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    meta: { title: '登录', noAuth: true },
    component: () => import('../views/login.vue'),
  },
  {
    path: '/403',
    name: '403',
    meta: { title: '无访问权限', noAuth: true },
    component: () => import('../views/403.vue'),
  },
  {
    path: '/404',
    name: '404',
    meta: { title: '页面不存在', noAuth: true },
    component: () => import('../views/404.vue'),
  },
  // 兜底：未匹配的路径重定向到 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

export default routes
