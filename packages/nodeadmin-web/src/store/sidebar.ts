import { defineStore } from 'pinia'

/**
 * 侧边栏 Store
 * 控制侧边栏折叠 / 展开状态
 */
export const useSidebarStore = defineStore('sidebar', {
  state: () => ({
    /** 侧边栏是否折叠 */
    collapse: false,
  }),
  actions: {
    /** 切换折叠状态 */
    handleCollapse() {
      this.collapse = !this.collapse
    },
  },
})
