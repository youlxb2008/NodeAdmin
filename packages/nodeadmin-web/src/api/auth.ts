import request from './request'
import type {
  ChangePasswordDto,
  InitStatusResponse,
  LoginResponse,
  UserInfo,
  ApiResponse,
  UpdateProfileDto,
} from '@nodeadmin/shared'

/**
 * 认证模块 API
 *
 * 所有接口均以 `/api/auth` 为前缀，鉴权通过 HttpOnly Cookie 自动携带。
 */

/**
 * 登录
 * @param data 用户名 / 密码
 * @returns 登录响应（含用户信息、菜单树、权限码）
 */
export const login = (data: { username: string; password: string }) =>
  request.post<ApiResponse<LoginResponse>>('/api/auth/login', data)

/** 登出 */
export const logout = () => request.post<ApiResponse<null>>('/api/auth/logout')

/**
 * 获取当前登录用户的资料、菜单、权限码
 * 用于刷新页面后恢复会话状态
 */
export const getProfile = () =>
  request.get<ApiResponse<{ user: UserInfo; menus: LoginResponse['menus']; perms: string[] }>>(
    '/api/auth/profile',
  )

/** 修改当前用户密码 */
export const changePassword = (data: ChangePasswordDto) =>
  request.put<ApiResponse<null>>('/api/auth/password', data)

/** 更新当前用户个人资料（昵称 / 邮箱 / 手机号 / 头像） */
export const updateProfile = (data: UpdateProfileDto) =>
  request.put<ApiResponse<UserInfo>>('/api/auth/profile', data)

/** 获取系统初始化状态（用于登录页判断是否需要走初始化流程） */
export const getInitStatus = () =>
  request.get<ApiResponse<InitStatusResponse>>('/api/auth/init-status')
