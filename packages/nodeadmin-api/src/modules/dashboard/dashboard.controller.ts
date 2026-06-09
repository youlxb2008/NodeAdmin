/**
 * 仪表盘控制器（DashboardController）
 *
 * 路由前缀：/api/admin/dashboard
 */
import { Controller, Get } from '@nestjs/common'
import { DashboardService } from './dashboard.service'

@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /** 获取仪表盘统计数据 */
  @Get('stats')
  async getStats() {
    return this.dashboardService.getStats()
  }
}
