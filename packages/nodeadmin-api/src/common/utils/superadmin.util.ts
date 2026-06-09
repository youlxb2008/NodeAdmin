/**
 * 超级管理员常量
 *
 * 集中管理超管判断逻辑，避免在多个 service 中硬编码。
 * 超管是系统内置账号，拥有所有权限且不可被删除/禁用/降级。
 */

/** 超管角色编码 */
export const SUPER_ADMIN_ROLE_CODE = 'super_admin'

/** 超管用户 ID（seed 时第一个创建的用户） */
export const SUPER_ADMIN_USER_ID = 1

/**
 * 判断角色编码是否为超管角色
 * @param code 角色编码
 */
export function isSuperAdminRole(code: string): boolean {
  return code === SUPER_ADMIN_ROLE_CODE
}

/**
 * 判断用户 ID 是否为超管账号
 * @param userId 用户 ID
 */
export function isSuperAdminUser(userId: number): boolean {
  return userId === SUPER_ADMIN_USER_ID
}
