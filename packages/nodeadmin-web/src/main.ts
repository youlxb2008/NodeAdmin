import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { addCollection } from '@iconify/vue'
import App from './App.vue'
import router, { setAuthenticated, registerDynamicRoutes } from './router'
import { useUserStore } from './store/user'
import { usePermissStore } from './store/permiss'
import { useMenuStore } from './store/menu'
import { getProfile } from './api/auth'
import { loadPublicSite } from './composables/useSiteSettings'
import 'element-plus/dist/index.css'
import './assets/css/variables.css'
import './assets/css/main.css'

/* 离线 Iconify 图标集（避免运行时调用 api.iconify.design） */
import phIcons from './assets/iconify/ph.json'
import mdiIcons from './assets/iconify/mdi.json'
import tablerIcons from './assets/iconify/tabler.json'

// 注册 Iconify 离线集合
addCollection(phIcons)
addCollection(mdiIcons)
addCollection(tablerIcons)

/**
 * 应用启动入口
 *
 * 启动流程：
 * 1. 创建 Vue 实例并装载 Pinia
 * 2. 全局注册 Element Plus 图标组件
 * 3. 应用主题（恢复 localStorage 中的暗/亮模式）
 * 4. 探测登录态：成功则写入 user/perms/menus 并注册动态路由
 * 5. 装载 Router 与全局指令，挂载到 #app
 */
async function bootstrap(): Promise<void> {
  const app = createApp(App)
  app.use(createPinia())

  // 加载公开站点配置（标题、登录页背景图），失败不影响启动
  await loadPublicSite()

  // 全局注册 Element Plus 图标组件（模板中可直接 <ElementName />）
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }

  // 探测登录态（依赖 HttpOnly Cookie）
  try {
    const res = await getProfile()
    const data = res.data?.data
    if (data?.user?.username) {
      const userStore = useUserStore()
      const permissStore = usePermissStore()
      const menuStore = useMenuStore()
      userStore.setUser(data.user)
      permissStore.setPerms(data.perms || [])
      menuStore.setMenus(data.menus || [])
      // 注册动态路由必须在 app.use(router) 之前完成，
      // 这样初次进入受保护路由时守卫能匹配到目标
      registerDynamicRoutes(router, data.menus || [])
      setAuthenticated(true)
    }
  } catch {
    // 探测失败则保持访客态，守卫会自动跳转登录页
    setAuthenticated(false)
  }

  app.use(router)

  /**
   * 全局指令 v-permiss
   *
   * 用法：<el-button v-permiss="'system:user:add'">新增</el-button>
   * 规则：若当前用户未拥有该权限码，则将元素 display 置为 none
   */
  const permissStore = usePermissStore()
  app.directive('permiss', {
    mounted(el: HTMLElement, binding) {
      const perm = String(binding.value || '')
      // 空权限码 → 不限制
      if (!perm) return
      if (!permissStore.perms.includes(perm)) {
        el.style.display = 'none'
      }
    },
  })

  app.mount('#app')
}

bootstrap()
