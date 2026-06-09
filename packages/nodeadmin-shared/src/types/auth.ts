/**
 * 认证相关类型定义
 *
 * 覆盖登录、JWT 载荷、当前用户信息、初始化状态、修改密码等场景，
 * 前后端共享以确保认证流程数据结构一致。
 */

// 使用 type-only import 避免运行时循环依赖
import type { MenuTreeNode } from './menu'

/**
 * 当前登录用户基础信息
 *
 * 用于前端展示当前用户头像 / 昵称 / 联系方式，
 * 后端登录接口和「获取当前用户」接口返回的 user 字段都使用该结构。
 */
export interface UserInfo {
  /** 用户主键 ID */
  id: number
  /** 登录账号 */
  username: string
  /** 昵称（用于界面展示） */
  nickname: string
  /** 头像 URL，未上传时为空字符串 */
  avatar: string
  /** 邮箱，未填写时为空字符串 */
  email: string
  /** 手机号，未填写时为空字符串 */
  phone: string
  /** 角色名称列表，用于个人中心等场景展示 */
  roles: string[]
}

/**
 * JWT Access Token 载荷
 *
 * 后端签发时写入；前端无需直接构造，仅在解码 debug 时使用。
 */
export interface JwtPayload {
  /** 用户 ID（sub 字段语义） */
  sub: number
  /** 登录账号 */
  username: string
  /** 签发时间（秒） */
  iat: number
  /** 过期时间（秒） */
  exp: number
}

/**
 * 登录响应数据
 *
 * 登录成功后一次性返回 token、用户信息、菜单树、权限码列表，
 * 前端据此初始化路由 / 按钮权限，无需再次拉取。
 */
export interface LoginResponse {
  /** JWT Access Token */
  accessToken: string
  /** Access Token 有效期（秒） */
  expiresIn: number
  /** 当前登录用户基础信息 */
  user: UserInfo
  /** 当前用户可访问的菜单树（已按权限过滤） */
  menus: MenuTreeNode[]
  /** 当前用户拥有的按钮 / 接口权限码（perm 字段集合） */
  perms: string[]
}

/**
 * 修改密码请求体
 *
 * 业务规则：旧密码必须与库中 hash 校验通过，
 * 新密码需满足强度规则（8+ 位、含字母与数字）。
 */
export interface ChangePasswordDto {
  /** 旧密码（明文，传输已 HTTPS 保护） */
  oldPassword: string
  /** 新密码（明文，后端入库前会 bcrypt 加密） */
  newPassword: string
}

/**
 * 系统初始化状态响应
 *
 * 用于前端在登录页判断是否需要跳转到「首次初始化」流程。
 */
export interface InitStatusResponse {
  /** true=系统已初始化（已有超管账号），false=尚未初始化 */
  initialized: boolean
}

/**
 * 更新个人资料请求体
 *
 * 所有字段均为可选，传了就更新；不传保持原值不变。
 * 用于 PUT /api/auth/profile 接口。
 */
export interface UpdateProfileDto {
  /** 昵称（界面展示） */
  nickname?: string
  /** 邮箱 */
  email?: string
  /** 手机号 */
  phone?: string
  /** 头像 URL（支持 base64 或外链） */
  avatar?: string
}
