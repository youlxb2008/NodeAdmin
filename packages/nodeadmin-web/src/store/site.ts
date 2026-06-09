/**
 * 站点配置 Store
 *
 * 管理平台标题、登录页背景图、布局宽度等全局配置。
 * 在 main.ts bootstrap 时从公开接口加载，供 login.vue / header.vue / sidebar.vue 使用。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 默认平台标题 */
const DEFAULT_TITLE = 'NodeAdmin'

export const useSiteStore = defineStore('site', () => {
  /** 平台标题 */
  const title = ref(DEFAULT_TITLE)
  /** 登录页背景图 URL（相对路径，如 /uploads/login-bg/xxx.png） */
  const loginBg = ref('')
  /** 布局宽度模式：default=默认，compact=紧凑 */
  const layoutWidth = ref<'default' | 'compact'>('default')

  /**
   * 设置站点配置
   * @param config 公开配置对象（title、loginBg、layoutWidth）
   */
  function setSite(config: {
    title?: string
    loginBg?: string
    layoutWidth?: 'default' | 'compact'
  }): void {
    if (config.title) {
      title.value = config.title
      // 同步更新浏览器标签标题
      document.title = `${config.title} 管理后台`
    }
    if (config.loginBg !== undefined) {
      loginBg.value = config.loginBg
    }
    if (config.layoutWidth) {
      layoutWidth.value = config.layoutWidth
    }
  }

  /** 重置为默认值（登出或初始化时调用） */
  function $reset(): void {
    title.value = DEFAULT_TITLE
    loginBg.value = ''
    layoutWidth.value = 'default'
    document.title = `${DEFAULT_TITLE} 管理后台`
  }

  return { title, loginBg, layoutWidth, setSite, $reset }
})
