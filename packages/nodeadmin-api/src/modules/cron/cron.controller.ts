/**
 * 定时任务控制器（CronController）
 *
 * 路由前缀：/api/admin/cron
 * 全部受全局 JwtAccessGuard 保护，按钮级权限通过 @Permiss 装饰器控制。
 *
 * 接口设计：
 *   - GET    /admin/cron/jobs           → 分页查询任务列表
 *   - POST   /admin/cron/jobs           → 创建任务
 *   - PUT    /admin/cron/jobs/:id       → 更新任务
 *   - DELETE /admin/cron/jobs/:id       → 删除任务
 *   - PUT    /admin/cron/jobs/:id/status → 切换启用/暂停
 *   - PUT    /admin/cron/jobs/:id/trigger → 手动触发一次
 *   - GET    /admin/cron/handlers       → 获取可用处理器列表
 *   - GET    /admin/cron/jobs/:id/logs  → 查询执行日志
 *   - DELETE /admin/cron/jobs/:id/logs  → 清空执行日志
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { CronService } from './cron.service'
import type {
  QueryCronJobParams,
  CreateCronJobParams,
  UpdateCronJobParams,
  QueryCronLogParams,
} from './cron.service'
import { Permiss } from '../../common/decorators/permiss.decorator'
import { successPage } from '../../common/utils/response.util'

@Controller('admin/cron')
export class CronController {
  constructor(private readonly cronService: CronService) {}

  /**
   * 分页查询任务列表
   * 路由：GET /api/admin/cron/jobs
   */
  @Permiss('system:cron:list')
  @Get('jobs')
  async findJobs(@Query() query: QueryCronJobParams) {
    const page = Number(query.page) || 1
    const size = Number(query.size) || 10
    const rawStatus = query.status as unknown as string
    const status = rawStatus !== undefined && rawStatus !== '' ? Number(rawStatus) : undefined

    const result = await this.cronService.findJobs({
      page,
      size,
      name: query.name,
      group: query.group,
      status,
    })
    return successPage(result.data, result.total, result.page, result.size)
  }

  /**
   * 获取所有可用的处理器列表
   * 路由：GET /api/admin/cron/handlers
   */
  @Permiss('system:cron:list')
  @Get('handlers')
  async getHandlers() {
    return this.cronService.getHandlers()
  }

  /**
   * 创建定时任务
   * 路由：POST /api/admin/cron/jobs
   */
  @Permiss('system:cron:create')
  @Post('jobs')
  async createJob(@Body() body: CreateCronJobParams) {
    return this.cronService.createJob(body)
  }

  /**
   * 更新定时任务
   * 路由：PUT /api/admin/cron/jobs/:id
   */
  @Permiss('system:cron:update')
  @Put('jobs/:id')
  async updateJob(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateCronJobParams) {
    return this.cronService.updateJob(id, body)
  }

  /**
   * 删除定时任务
   * 路由：DELETE /api/admin/cron/jobs/:id
   */
  @Permiss('system:cron:delete')
  @Delete('jobs/:id')
  async deleteJob(@Param('id', ParseIntPipe) id: number) {
    return this.cronService.deleteJob(id)
  }

  /**
   * 切换任务启用/暂停状态
   * 路由：PUT /api/admin/cron/jobs/:id/status
   */
  @Permiss('system:cron:update')
  @Put('jobs/:id/status')
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.cronService.toggleJobStatus(id)
  }

  /**
   * 手动触发一次任务执行
   * 路由：PUT /api/admin/cron/jobs/:id/trigger
   */
  @Permiss('system:cron:trigger')
  @Put('jobs/:id/trigger')
  async triggerJob(@Param('id', ParseIntPipe) id: number) {
    return this.cronService.triggerJob(id)
  }

  /**
   * 查询任务的执行日志（分页）
   * 路由：GET /api/admin/cron/jobs/:id/logs
   */
  @Permiss('system:cron:list')
  @Get('jobs/:id/logs')
  async findLogs(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: { page?: string; size?: string; status?: string },
  ) {
    const page = Number(query.page) || 1
    const size = Number(query.size) || 10
    const rawStatus = query.status
    const status = rawStatus !== undefined && rawStatus !== '' ? Number(rawStatus) : undefined

    const result = await this.cronService.findLogs({ page, size, jobId: id, status })
    return successPage(result.data, result.total, result.page, result.size)
  }

  /**
   * 清空任务的执行日志
   * 路由：DELETE /api/admin/cron/jobs/:id/logs
   */
  @Permiss('system:cron:delete')
  @Delete('jobs/:id/logs')
  async clearLogs(@Param('id', ParseIntPipe) id: number) {
    return this.cronService.clearLogs(id)
  }
}
