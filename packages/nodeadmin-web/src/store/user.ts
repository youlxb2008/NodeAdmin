import { defineStore } from 'pinia'
import type { UserInfo } from '@nodeadmin/shared'

/**
 * 用户信息 Store
 *
 * 仅缓存当前登录用户的基础资料（id、用户名、昵称、头像 等），
 * 不存储 token —— 鉴权完全依赖 HttpOnly Cookie。
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    /** 当前登录用户信息，未登录为 null */
    userInfo: null as UserInfo | null,
  }),
  getters: {
    /** 优先返回昵称；昵称为空时回退用户名；都没有时返回空串 */
    nickname(state): string {
      return state.userInfo?.nickname || state.userInfo?.username || ''
    },
    /** 是否已登录 */
    isLoggedIn(state): boolean {
      return !!state.userInfo
    },
  },
  actions: {
    /** 设置当前登录用户 */
    setUser(user: UserInfo) {
      this.userInfo = user
    },
    /** 清空当前登录用户（登出时调用） */
    clearUser() {
      this.userInfo = null
    },
  },
})
