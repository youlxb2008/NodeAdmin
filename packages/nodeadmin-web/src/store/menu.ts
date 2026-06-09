import { defineStore } from 'pinia'
import type { MenuTreeNode } from '@nodeadmin/shared'

/**
 * 菜单 Store
 *
 * 存储后端下发的当前用户可见菜单树（已按权限过滤）。
 * 侧边栏、动态路由注册均消费此数据。
 */
export const useMenuStore = defineStore('menu', {
  state: () => ({
    /** 菜单树根节点列表 */
    menus: [] as MenuTreeNode[],
  }),
  actions: {
    /** 设置菜单树 */
    setMenus(menus: MenuTreeNode[]) {
      this.menus = menus || []
    },
    /** 清空菜单（登出时调用） */
    clearMenus() {
      this.menus = []
    },
  },
})
