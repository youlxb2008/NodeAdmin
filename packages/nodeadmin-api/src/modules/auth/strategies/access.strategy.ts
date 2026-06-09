/**
 * JWT Access Token 验证策略
 *
 * 双路 token 提取，兼顾两种前端模式：
 *   1. Authorization: Bearer xxx  —— 管理后台前端 localStorage 模式
 *   2. Cookie: access_token=xxx   —— 门户侧 HttpOnly Cookie 模式
 *
 * 验证通过后，将载荷挂载到 request.user，供 @CurrentUser 装饰器消费。
 */
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'

@Injectable()
export class AccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor() {
    // JWT_ACCESS_SECRET 从环境变量读取，未配置时使用内置默认密钥（仅开发环境安全，生产务必配置）
    const secret = process.env.JWT_ACCESS_SECRET || 'nodeadmin-default-jwt-secret-please-change-me'

    super({
      /* 组合提取器：先取 Header，再回落到 Cookie */
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => req?.cookies?.access_token || null,
      ]),
      // 不忽略过期时间，过期 token 会触发 TokenExpiredError
      ignoreExpiration: false,
      secretOrKey: secret,
    })
  }

  /**
   * 验证通过后的回调，返回值会被挂载到 request.user
   *
   * @param payload JWT 载荷（由登录接口签发，至少含 sub/username）
   * @returns 注入到 request.user 的精简对象（包含 perms 以供 PermissGuard 使用）
   */
  async validate(payload: { sub: number; username: string; perms?: string[]; [k: string]: any }) {
    if (!payload.username) throw new UnauthorizedException()
    return {
      // sub 即用户主键 ID
      id: payload.sub,
      username: payload.username,
      // perms 数组用于 PermissGuard 校验；登录签发时写入，未写入则视为空数组
      perms: Array.isArray(payload.perms) ? payload.perms : [],
    }
  }
}
