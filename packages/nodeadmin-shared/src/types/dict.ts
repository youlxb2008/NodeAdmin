/**
 * 字典相关类型定义
 *
 * 字典用于维护可枚举的业务取值（如「性别」「订单状态」），
 * 同一 type 下含多条 label/value 选项，前端表单的下拉框可统一拉取。
 */

// 使用 type-only import 避免运行时循环依赖
import type { PageQuery } from './common'

/**
 * 字典实体（对应字典表）
 *
 * 每行对应一个具体的字典选项；通过 type 字段将多个选项归属到同一字典分组。
 */
export interface Dict {
  /** 字典项主键 ID */
  id: number
  /** 字典类型编码（如 'user_gender'），同一组使用相同 type */
  type: string
  /** 显示文本（如「男」） */
  label: string
  /** 实际取值（如 '1'，存储为字符串以兼容数字 / 编码两类用法） */
  value: string
  /** 排序权重，值越小越靠前 */
  sort: number
  /** 0=禁用 1=启用 */
  status: number
  /** 创建时间 ISO 字符串 */
  createdAt: string
  /** 更新时间 ISO 字符串 */
  updatedAt: string
}

/**
 * 创建字典项请求体
 */
export interface CreateDictDto {
  /** 字典类型编码 */
  type: string
  /** 显示文本 */
  label: string
  /** 实际取值 */
  value: string
  /** 排序权重 */
  sort?: number
  /** 状态 */
  status?: number
}

/**
 * 更新字典项请求体（部分更新）
 */
export interface UpdateDictDto {
  /** 字典类型编码 */
  type?: string
  /** 显示文本 */
  label?: string
  /** 实际取值 */
  value?: string
  /** 排序权重 */
  sort?: number
  /** 状态 */
  status?: number
}

/**
 * 字典查询参数
 */
export interface QueryDictDto extends PageQuery {
  /** 按类型编码筛选 */
  type?: string
  /** 按状态筛选 */
  status?: number
}
