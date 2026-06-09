import { defineStore } from 'pinia'

/**
 * 按钮 / 接口权限 Store
 *
 * 存储当前登录用户拥有的权限码（perm）列表，
 * v-permiss 指令、菜单过滤、路由守卫均基于此判断。
 */
export const usePermissStore = defineStore('permiss', {
  state: () => ({
    /** 当前用户的权限码列表，如 ['system:user:add', 'system:role:edit'] */
    perms: [] as string[],
  }),
  getters: {
    /** 判断是否拥有指定权限码 */
    has(state) {
      return (perm: string): boolean => {
        // 空权限码表示无需鉴权，直接放行
        if (!perm) return true
        return state.perms.includes(perm)
      }
    },
  },
  actions: {
    /** 批量写入权限码 */
    setPerms(perms: string[]) {
      this.perms = perms || []
    },
    /** 清空权限码（登出时调用） */
    clearPerms() {
      this.perms = []
    },
  },
})
