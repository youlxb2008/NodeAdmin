/**
 * 用户相关类型定义
 *
 * 包括用户实体、增/删/改/查 DTO、角色分配等结构。
 * 用户 — 角色为多对多关系，通过中间表 user_roles 维护。
 */

// 使用 type-only import 避免运行时循环依赖
import type { IdDto, PageQuery } from './common'
import type { Role } from './role'

/**
 * 用户实体（对应用户表）
 *
 * 不包含密码 hash 字段 — 该字段仅在服务端内部使用，不暴露给前端。
 */
export interface User {
  /** 用户主键 ID */
  id: number
  /** 登录账号 */
  username: string
  /** 显示昵称 */
  nickname: string
  /** 邮箱 */
  email: string
  /** 手机号 */
  phone: string
  /** 头像 URL */
  avatar: string
  /** 0=禁用 1=启用 */
  status: number
  /** 备注 */
  remark: string
  /** 创建时间 ISO 字符串 */
  createdAt: string
  /** 更新时间 ISO 字符串 */
  updatedAt: string
}

/**
 * 创建用户请求体
 */
export interface CreateUserDto {
  /** 登录账号 */
  username: string
  /** 密码（明文，后端 bcrypt 加密入库） */
  password: string
  /** 昵称 */
  nickname?: string
  /** 邮箱 */
  email?: string
  /** 手机号 */
  phone?: string
  /** 头像 URL */
  avatar?: string
  /** 状态，默认启用 */
  status?: number
  /** 备注 */
  remark?: string
  /** 初始分配的角色 ID 列表 */
  roleIds?: number[]
}

/**
 * 更新用户请求体（部分更新）
 */
export interface UpdateUserDto {
  /** 昵称 */
  nickname?: string
  /** 邮箱 */
  email?: string
  /** 手机号 */
  phone?: string
  /** 头像 URL */
  avatar?: string
  /** 状态 */
  status?: number
  /** 备注 */
  remark?: string
  /** 重新分配的角色 ID 列表 */
  roleIds?: number[]
}

/**
 * 用户列表查询参数
 */
export interface QueryUserDto extends PageQuery {
  /** 筛选用户状态 */
  status?: number
}

/**
 * 用户 + 关联角色视图
 *
 * 在用户详情或编辑弹窗中一并返回用户信息及其已分配的角色。
 */
export interface UserWithRoles extends User {
  /** 该用户已分配的角色列表 */
  roles: Role[]
}

/**
 * 为用户分配角色请求体
 */
export interface AssignRolesDto extends IdDto {
  /** 要关联的角色 ID 列表；传空数组表示清空所有角色 */
  roleIds: number[]
}
