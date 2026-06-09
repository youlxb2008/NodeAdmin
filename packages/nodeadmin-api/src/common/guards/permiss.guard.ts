/**
 * 按钮 / 接口级权限守卫（PermissGuard）
 *
 * 在 JwtAccessGuard 之后运行：基于 @Permiss('xxx:yyy') 元数据校验
 * 当前登录用户的 perms 数组是否包含所需权限码。
 *
 * 兼容场景：
 *   - 未标注 @Permiss 的路由 → 直接放行
 *   - 未登录用户（@Public 路由）→ 由于没标 @Permiss，不会走到这里；
 *     即使误标了 @Permiss，也按"无权限"处理
 *   - request.user.perms 未注入（如 OptionalAuth 未登录） → 按"无权限"处理
 */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PERMISS_KEY } from '../decorators/permiss.decorator'

@Injectable()
export class PermissGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 读取目标路由的 @Permiss 元数据；未标注则放行
    const requiredPerm = this.reflector.getAllAndOverride<string>(IS_PERMISS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredPerm) return true

    // 取出 JwtAccessGuard 注入的 user 对象
    const request = context.switchToHttp().getRequest()
    const user = request.user as { perms?: string[] } | undefined

    // 用户未登录或 perms 未注入 → 视为无权限
    if (!user || !Array.isArray(user.perms)) {
      throw new ForbiddenException(`缺少访问权限：${requiredPerm}`)
    }

    // 校验权限码是否在 perms 列表中
    if (!user.perms.includes(requiredPerm)) {
      throw new ForbiddenException(`缺少访问权限：${requiredPerm}`)
    }

    return true
  }
}
