/**
 * @Permiss('xxx:yyy') 装饰器
 *
 * 标注接口所需的按钮 / 接口级权限码，由 PermissGuard 在认证后做二次校验。
 * 例如：@Permiss('system:user:create') 表示仅当用户的 perms 数组中包含
 *      'system:user:create' 时才允许访问该接口。
 *
 * 未标注此装饰器的路由，PermissGuard 直接放行。
 */
import { SetMetadata } from '@nestjs/common'

/** 元数据 key — PermissGuard 读取此 key 取得所需权限码 */
export const IS_PERMISS_KEY = 'permissCode'

/**
 * 声明当前接口所需的权限码
 * @param code 权限码，与菜单表 perm 字段对应（如 'system:user:create'）
 */
export const Permiss = (code: string) => SetMetadata(IS_PERMISS_KEY, code)
