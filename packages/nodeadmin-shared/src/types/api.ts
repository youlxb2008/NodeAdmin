/**
 * 统一 API 响应类型定义
 *
 * 后端所有接口必须遵循 `ApiResponse` / `PageResponse` 格式，
 * 前端的响应拦截器据此自动展开 data 字段。
 */

/** 业务错误码 — 0 表示成功，其它值表示具体业务异常 */
export enum ErrorCode {
  /** 成功 */
  SUCCESS = 0,
  /** 请求参数错误（DTO 校验失败、字段非法等） */
  BAD_REQUEST = 1001,
  /** 未认证（缺失 / 无效 / 过期的 token） */
  UNAUTHORIZED = 1002,
  /** 无权限（已登录但缺少访问该资源所需的权限） */
  FORBIDDEN = 1003,
  /** 资源不存在 */
  NOT_FOUND = 1004,
  /** 用户名或密码错误 */
  INVALID_CREDENTIALS = 1005,
  /** 系统已初始化（不允许重复执行初始化） */
  ALREADY_INITIALIZED = 1006,
  /** 密码强度不足（如长度 / 复杂度不满足要求） */
  WEAK_PASSWORD = 1007,
  /** 分享已过期（保留位，便于未来扩展） */
  SHARE_EXPIRED = 1008,
  /** 分享密码错误（保留位，便于未来扩展） */
  SHARE_WRONG_PASSWORD = 1009,
  /** 菜单不存在 */
  MENU_NOT_FOUND = 1010,
  /** 角色正在被用户引用，禁止删除 */
  ROLE_IN_USE = 1011,
  /** 用户已被禁用，禁止登录 */
  USER_DISABLED = 1012,
  /** 服务器内部错误（未捕获异常的兜底） */
  INTERNAL_ERROR = 2000,
}

/**
 * 统一响应格式
 *
 * @typeParam T - data 字段的具体类型
 */
export interface ApiResponse<T = unknown> {
  /** 0=成功，非 0=业务错误 */
  code: ErrorCode | number
  /** 可选的提示消息（前端用于 toast 展示） */
  message?: string
  /** 响应数据本体 */
  data?: T
}

/**
 * 分页响应格式
 *
 * @typeParam T - 列表项类型
 */
export interface PageResponse<T = unknown> {
  /** 业务码 */
  code: ErrorCode | number
  /** 可选消息 */
  message?: string
  /** 当前页数据列表 */
  data: T[]
  /** 总记录数 */
  total: number
  /** 当前页码（1-based） */
  page: number
  /** 每页条数 */
  size: number
}
