/**
 * 站点设置控制器（SiteController）
 *
 * 路由设计（全局前缀为 api）：
 *   - GET  /api/admin/site      → 获取管理端站点配置（需登录）
 *   - PUT  /api/admin/site      → 更新站点配置（需登录）
 *   - GET  /api/public/site     → 获取公开站点配置（无需登录）
 */
import { Body, Controller, Get, Put } from '@nestjs/common'
import { Public } from '../../common/decorators/public.decorator'
import { SiteService } from './site.service'
import type { UpdateSiteDto } from './site.service'

@Controller()
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  /**
   * 获取管理端站点配置
   *
   * 需要登录态，返回完整的站点配置（title + loginBg）。
   * 路由：GET /api/admin/site
   *
   * @returns 站点配置对象
   */
  @Get('admin/site')
  async getAdmin() {
    return this.siteService.getAdmin()
  }

  /**
   * 更新站点配置
   *
   * 需要登录态，支持部分更新（title / loginBg）。
   * 路由：PUT /api/admin/site
   *
   * @param body 更新参数
   * @returns 更新后的完整配置
   */
  @Put('admin/site')
  async updateSite(@Body() body: UpdateSiteDto) {
    return this.siteService.updateSite(body)
  }

  /**
   * 获取公开站点配置
   *
   * 无需登录，供登录页展示站点标题和背景图。
   * 路由：GET /api/public/site
   *
   * @returns 站点配置对象（title + loginBg）
   */
  @Public()
  @Get('public/site')
  async getPublic() {
    return this.siteService.getPublic()
  }
}
