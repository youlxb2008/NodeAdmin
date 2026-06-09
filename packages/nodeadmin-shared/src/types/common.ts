/**
 * 通用基础类型定义
 *
 * 提供分页查询、ID 入参、状态枚举等被多个模块共享的基础结构。
 */

/**
 * 通用分页查询参数
 *
 * 所有列表接口的查询 DTO 都应继承或组合此接口，
 * 以保证分页字段命名风格一致。
 */
export interface PageQuery {
  /** 当前页码（1-based），默认 1 */
  page?: number
  /** 每页条数，默认 10 */
  size?: number
  /** 关键字模糊检索，由各模块自行决定匹配字段 */
  keyword?: string
}

/**
 * 通用 ID 入参
 *
 * 用于 path 参数或 body 中只携带 id 的场景。
 */
export interface IdDto {
  /** 主键 ID */
  id: number
}

/**
 * 启停状态枚举
 *
 * 使用 `as const` 而非 enum，避免 enum 在 bundler / ESM 下的兼容性问题，
 * 同时仍能通过 `typeof StatusEnum[keyof typeof StatusEnum]` 提取联合类型。
 */
export const StatusEnum = {
  /** 启用 */
  ENABLED: 1,
  /** 禁用 */
  DISABLED: 0,
} as const

/** 启停状态联合类型（值：0 | 1） */
export type StatusEnumValue = (typeof StatusEnum)[keyof typeof StatusEnum]
