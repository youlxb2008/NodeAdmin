/**
 * JWT Access Token 全局守卫
 *
 * 继承 AuthGuard('jwt-access')，委托给 AccessStrategy（passport-jwt）做 token 验证。
 * 三种路由认证级别：
 *   - @Public()        ：完全跳过认证
 *   - @OptionalAuth()  ：有 token 则验证并注入 user；无 / 失败则降级为访客（不抛 401）
 *   - 默认              ：必须提供有效 token，否则抛 401
 */
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { IS_OPTIONAL_AUTH_KEY } from '../decorators/optional-auth.decorator'

@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {
  constructor(private reflector: Reflector) {
    super()
  }

  /**
   * 守卫主入口：根据装饰器元数据决定走哪个认证分支
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // 1. @Public() 路由直接放行
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    // 2. @OptionalAuth() 路由走可选认证分支
    const isOptional = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isOptional) {
      return this.handleOptionalAuth(context)
    }

    // 3. 默认：交给 passport-jwt 严格校验
    return super.canActivate(context)
  }

  /**
   * OptionalAuth 逻辑：
   *   - 无 token / 无效 token / 过期 token  → 放行（req.user 可能为 undefined）
   *   - 有效 token                            → 放行（req.user 已由 passport 注入）
   */
  private async handleOptionalAuth(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context)
      return true
    } catch {
      // token 无效或过期 → 仍然放行
      return true
    }
  }

  /**
   * passport 验证后的回调（仅非 OptionalAuth 路由走到这里）
   * 将原始 jwt 错误归一化为带中文友好提示的 401
   */
  handleRequest<TUser = any>(err: any, user: TUser, info: any): TUser {
    if (err || !user) {
      const message =
        info?.name === 'TokenExpiredError'
          ? 'Token 已过期，请重新登录'
          : info?.name === 'JsonWebTokenError'
            ? 'Token 格式错误'
            : '未提供有效的认证凭证'
      throw err || new UnauthorizedException(message)
    }
    return user
  }
}
