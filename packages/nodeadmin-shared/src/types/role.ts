/**
 * 角色相关类型定义
 *
 * 角色 — 菜单为多对多关系，通过中间表 role_menus 维护，
 * 用于实现 RBAC 中的「角色拥有哪些菜单 / 按钮权限」。
 */

// 使用 type-only import 避免运行时循环依赖
import type { IdDto, PageQuery } from './common'
import type { Menu } from './menu'

/**
 * 角色实体（对应角色表）
 */
export interface Role {
  /** 角色主键 ID */
  id: number
  /** 角色名称（用于界面展示，如「系统管理员」） */
  name: string
  /** 角色编码（用于代码判断，如 'admin'，全局唯一） */
  code: string
  /** 排序权重，值越小越靠前 */
  sort: number
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
 * 创建角色请求体
 */
export interface CreateRoleDto {
  /** 角色名称 */
  name: string
  /** 角色编码（全局唯一） */
  code: string
  /** 排序权重 */
  sort?: number
  /** 状态 */
  status?: number
  /** 备注 */
  remark?: string
  /** 初始分配的菜单 ID 列表 */
  menuIds?: number[]
}

/**
 * 更新角色请求体（部分更新）
 */
export interface UpdateRoleDto {
  /** 角色名称 */
  name?: string
  /** 角色编码 */
  code?: string
  /** 排序权重 */
  sort?: number
  /** 状态 */
  status?: number
  /** 备注 */
  remark?: string
  /** 重新分配的菜单 ID 列表 */
  menuIds?: number[]
}

/**
 * 角色列表查询参数
 */
export interface QueryRoleDto extends PageQuery {
  /** 筛选角色状态 */
  status?: number
}

/**
 * 角色 + 关联菜单视图
 *
 * 在角色详情或菜单授权弹窗中一并返回角色信息及已分配的菜单列表。
 */
export interface RoleWithMenus extends Role {
  /** 该角色已分配的菜单列表 */
  menus: Menu[]
}

/**
 * 为角色分配菜单请求体
 */
export interface AssignMenusDto extends IdDto {
  /** 要关联的菜单 ID 列表；传空数组表示清空该角色全部菜单权限 */
  menuIds: number[]
}
