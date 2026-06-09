/**
 * 认证控制器（AuthController）
 *
 * 路由前缀：/api/auth
 * 提供登录、登出、查询当前用户、修改密码、查询系统初始化状态等接口。
 * 登录成功后通过 HttpOnly Cookie 下发 access_token，浏览器自动携带，前端无需手动处理。
 */
import { Body, Controller, Get, Post, Put, Res } from '@nestjs/common'
import type { Response } from 'express'
import { AuthService } from './auth.service'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { parseAccessExpiresInSeconds } from '../../common/utils/token.util'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 检查系统是否已初始化（user 表是否非空）
   * 公开接口：前端登录页用以决定是否跳到初始化流程
   */
  @Public()
  @Get('init-status')
  async getInitStatus() {
    return this.authService.getInitStatus()
  }

  /**
   * 登录
   *
   * 业务流程：
   *   1. AuthService.login 校验密码并签发 JWT
   *   2. 通过 Set-Cookie 下发 HttpOnly access_token（生产环境 secure+SameSite=None 跨域；
   *      开发环境 SameSite=Lax 避免被浏览器拦截）
   *   3. 响应体回传 user / menus / perms 供前端立刻初始化路由与按钮权限
   *
   * @param body 登录入参 `{ username, password }`
   * @param res  Express Response（passthrough=true 允许同时返回数据 + 设置 Header）
   */
  @Public()
  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body.username, body.password)

    // 生产环境必须 secure 且 SameSite=None 才能跨子域共享 Cookie
    const isProd = process.env.NODE_ENV === 'production'
    // 兜底 7 天；与 JwtAccessGuard 解析过期时间保持一致
    const maxAgeMs = parseAccessExpiresInSeconds(604800) * 1000

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: maxAgeMs,
    })

    // 响应体不再返回 accessToken，避免泄露给 JS（HttpOnly 模式核心理念）
    return {
      user: result.user,
      menus: result.menus,
      perms: result.perms,
      expiresIn: result.expiresIn,
    }
  }

  /**
   * 登出：清除 access_token Cookie
   * 需要登录态才能调用（避免被恶意请求误清正常用户的 Cookie）
   */
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    await this.authService.logout()
    // path 必须与下发时一致，否则浏览器无法精确匹配清除
    res.clearCookie('access_token', { path: '/' })
    return { message: '已登出' }
  }

  /**
   * 获取当前登录用户的最新基础信息 + 菜单 + 权限码
   * 前端在路由切换 / F5 刷新后重新拉取，确保权限实时
   */
  @Get('profile')
  async getProfile(@CurrentUser('id') userId: number) {
    return this.authService.getProfile(userId)
  }

  /**
   * 更新当前登录用户的个人资料
   *
   * 支持更新字段：nickname / email / phone / avatar（传了就更新）
   * @param userId 当前登录用户 ID（由 JWT payload.sub 注入）
   * @param body   待更新的字段对象
   * @returns 更新后的 UserInfo
   */
  @Put('profile')
  async updateProfile(
    @CurrentUser('id') userId: number,
    @Body() body: { nickname?: string; email?: string; phone?: string; avatar?: string },
  ) {
    return this.authService.updateProfile(userId, body)
  }

  /**
   * 修改密码
   * @param userId 当前登录用户 ID（由 JWT payload.sub 注入）
   * @param body   `{ oldPassword, newPassword }`
   */
  @Put('password')
  async changePassword(
    @CurrentUser('id') userId: number,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(userId, body.oldPassword, body.newPassword)
  }
}
