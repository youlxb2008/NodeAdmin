import type { Router, RouteRecordRaw } from 'vue-router'
import type { MenuTreeNode } from '@nodeadmin/shared'
import { useUserStore } from '../store/user'
import { usePermissStore } from '../store/permiss'
import { useSiteStore } from '../store/site'

/**
 * 全局已认证标记
 *
 * main.ts 启动时探测 /auth/profile，根据结果调用 setAuthenticated 切换。
 * 守卫据此决定未登录跳登录页。
 */
let authenticated = false

/** 设置全局认证标记（main.ts 与 login.vue 调用） */
export function setAuthenticated(value: boolean): void {
  authenticated = value
}

/** 查询当前认证状态 */
export function isAuthenticated(): boolean {
  return authenticated
}

/**
 * 业务页面组件 glob 表
 *
 * 后端菜单中 component 字段为相对 views/ 的路径，
 * 这里用 import.meta.glob 动态加载对应组件。
 * 例：菜单 component = 'system/user/index' → '../views/system/user/index.vue'
 */
const viewModules = import.meta.glob('../views/**/*.vue')

/** 标记动态路由是否已注册，避免重复注册 */
let dynamicRoutesAdded = false

/**
 * 根据菜单组件路径定位到对应的 Vue 组件
 * @param component 菜单的 component 字段（相对 views/，不含扩展名）
 * @returns 异步组件构造函数；未找到时返回 404
 */
function resolveComponent(component: string) {
  const key = `../views/${component}.vue`
  const loader = viewModules[key]
  // 找不到时回退到 404，避免白屏
  return loader || viewModules['../views/404.vue']
}

/**
 * 递归把菜单树转成 Vue Router 路由配置
 * 仅菜单类型（'M'）参与路由注册；按钮类型（'B'）仅作为权限码使用
 * @param nodes 菜单树节点
 * @returns 路由配置数组
 */
function buildRoutesFromMenus(nodes: MenuTreeNode[]): RouteRecordRaw[] {
  const result: RouteRecordRaw[] = []
  for (const node of nodes) {
    // 跳过按钮类型节点
    if (node.type !== 'M') continue

    // 子菜单递归必须放在 continue 之前，否则父节点没有 component 时子节点也会被跳过
    if (node.children?.length) {
      result.push(...buildRoutesFromMenus(node.children))
    }

    // 路径或组件缺失则跳过当前节点（仅跳过自身，不影响子节点）
    if (!node.path || !node.component) continue

    const route: RouteRecordRaw = {
      // 父路由作为 Layout 子路由挂载，因此剔除开头的斜杠
      path: node.path.replace(/^\//, ''),
      name: node.path,
      meta: { title: node.name, perm: node.perm, icon: node.icon },
      component: resolveComponent(node.component),
    }
    result.push(route)
  }
  return result
}

/**
 * 根据菜单注册动态路由到 Layout 下
 * @param router Vue Router 实例
 * @param menus 当前用户的菜单树
 */
export function registerDynamicRoutes(router: Router, menus: MenuTreeNode[]): void {
  if (dynamicRoutesAdded) return
  const routes = buildRoutesFromMenus(menus)
  for (const route of routes) {
    // 全部挂在 Layout 路由（name: 'Layout'）之下
    router.addRoute('Layout', route)
  }
  dynamicRoutesAdded = true
}

/** 重置动态路由标记（登出 / 重新登录时调用） */
export function resetDynamicRoutes(): void {
  dynamicRoutesAdded = false
}

/**
 * 配置全局路由守卫
 *
 * 守卫规则：
 * 1. 设置页面标题
 * 2. 未登录访问受保护路由 → 跳转登录页
 * 3. 已登录但缺少权限 → 跳转 403
 * 4. 其余正常放行
 */
export function setupGuards(router: Router): void {
  router.beforeEach((to, _from, next) => {
    // 1. 同步页面标题：使用站点设置中的平台标题，避免写死 NodeAdmin
    const siteStore = useSiteStore()
    const siteTitle = siteStore.title || 'NodeAdmin'
    const pageTitle = String(to.meta.title || '')
    document.title = pageTitle ? `${pageTitle} | ${siteTitle}` : `${siteTitle} 管理后台`

    // 2. 未登录 + 非白名单路由 → 登录页
    if (!authenticated && !to.meta.noAuth) {
      next('/login')
      return
    }

    // 3. 已登录访问登录页 → 重定向到首页
    if (authenticated && to.path === '/login') {
      next('/')
      return
    }

    // 4. 权限码校验（路由 meta.perm 存在时才校验）
    const perm = to.meta.perm as string | undefined
    if (perm) {
      const permiss = usePermissStore()
      if (!permiss.has(perm)) {
        next('/403')
        return
      }
    }

    // 5. 用户实例用于在某些后续扩展中复用（保留引用以避免 unused 警告）
    useUserStore()
    next()
  })
}
