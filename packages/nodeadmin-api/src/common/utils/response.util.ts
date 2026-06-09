/**
 * 统一响应工具
 *
 * 所有 Controller 通过此工具构造响应，保证前端响应拦截器能正确解包。
 * 与 TransformInterceptor 配合：若 Controller 已返回 `{ code, ... }`，
 * 拦截器会透传不再二次包装。
 */

/**
 * 成功响应
 * @param data    业务数据
 * @param message 可选提示文案（默认 'success'）
 */
export function success<T>(data: T, message?: string) {
  return { code: 0, message: message || 'success', data }
}

/**
 * 分页响应
 * @param data  当前页数据列表
 * @param total 总记录数
 * @param page  当前页码（1-based）
 * @param size  每页条数
 */
export function successPage<T>(data: T[], total: number, page: number, size: number) {
  return { code: 0, message: 'success', data, total, page, size }
}

/**
 * 失败响应
 * @param code    业务错误码（非 0）
 * @param message 错误提示文案
 */
export function fail(code: number, message: string) {
  return { code, message }
}
