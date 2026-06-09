/**
 * 定时任务服务（CronService）
 *
 * 负责定时任务的 CRUD 业务逻辑，以及与调度引擎的交互。
 * 不直接处理调度逻辑，而是通过 CronScheduler 管理调度的增删改。
 */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CronJobEntity } from '../../entities/cron-job.entity'
import { CronLogEntity } from '../../entities/cron-log.entity'
import { CronScheduler } from './cron.scheduler'
import { CronHandlerRegistry } from './cron.handler'
import { paginate, PageResult } from '../../common/utils/pagination.util'
/** cron@4.x 的 CronJob 类，用于校验表达式 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CronJobLib: any = require('cron').CronJob

/** 查询任务参数 */
export interface QueryCronJobParams {
  page?: number
  size?: number
  name?: string
  group?: string
  status?: number
}

/** 创建任务参数 */
export interface CreateCronJobParams {
  name: string
  group?: string
  cronExpression: string
  handler: string
  params?: string
  description?: string
  concurrent?: number
  misfirePolicy?: number
  status?: number
}

/** 更新任务参数 */
export interface UpdateCronJobParams {
  name?: string
  group?: string
  cronExpression?: string
  handler?: string
  params?: string
  description?: string
  concurrent?: number
  misfirePolicy?: number
  status?: number
}

/** 查询日志参数 */
export interface QueryCronLogParams {
  page?: number
  size?: number
  jobId: number
  status?: number
}

@Injectable()
export class CronService {
  constructor(
    @InjectRepository(CronJobEntity)
    private readonly jobRepo: Repository<CronJobEntity>,
    @InjectRepository(CronLogEntity)
    private readonly logRepo: Repository<CronLogEntity>,
    private readonly cronScheduler: CronScheduler,
    private readonly handlerRegistry: CronHandlerRegistry,
  ) {}

  // ============ 任务 CRUD ============

  /**
   * 分页查询任务列表
   * 支持按 name 模糊检索、group 和 status 精确筛选
   */
  async findJobs(params: QueryCronJobParams): Promise<PageResult<CronJobEntity>> {
    const { page = 1, size = 10, name, group, status } = params

    const qb = this.jobRepo.createQueryBuilder('j').orderBy('j.id', 'DESC')

    // 按名称模糊检索
    if (name && name.trim()) {
      qb.andWhere('j.name LIKE :name', { name: `%${name.trim()}%` })
    }
    // 按分组筛选
    if (group && group.trim()) {
      qb.andWhere('j.group = :group', { group: group.trim() })
    }
    // 按状态筛选
    if (status === 0 || status === 1) {
      qb.andWhere('j.status = :status', { status })
    }

    return paginate(qb, page, size)
  }

  /**
   * 查询单个任务
   */
  async findJob(id: number): Promise<CronJobEntity> {
    const job = await this.jobRepo.findOne({ where: { id } })
    if (!job) throw new NotFoundException('任务不存在')
    return job
  }

  /**
   * 创建定时任务
   *
   * 流程：
   *   1. 校验必填字段
   *   2. 校验 handler 是否已注册
   *   3. 校验 cron 表达式格式
   *   4. 保存到数据库
   *   5. 如果状态为启用，注册到调度引擎
   */
  async createJob(params: CreateCronJobParams): Promise<CronJobEntity> {
    // 校验必填字段
    if (!params.name || !params.cronExpression || !params.handler) {
      throw new BadRequestException('任务名称、Cron 表达式和处理器不能为空')
    }

    // 校验 handler 是否已注册
    if (!this.handlerRegistry.hasHandler(params.handler)) {
      throw new BadRequestException(`处理器「${params.handler}」未注册`)
    }

    // 校验 cron 表达式格式
    this.validateCronExpression(params.cronExpression)

    // 保存到数据库（使用 as 断言绕过 TypeORM DeepPartial 对 null 的类型不兼容）
    const job = this.jobRepo.create({
      name: params.name,
      group: params.group || 'default',
      cronExpression: params.cronExpression,
      handler: params.handler,
      params: params.params || null,
      description: params.description || '',
      concurrent: params.concurrent ?? 0,
      misfirePolicy: params.misfirePolicy ?? 1,
      status: params.status ?? 1,
    } as Partial<CronJobEntity>)
    const saved = await this.jobRepo.save(job)

    // 如果启用状态，注册到调度引擎
    if (saved.status === 1) {
      this.cronScheduler.addCronJob(saved)
    }

    return saved
  }

  /**
   * 更新定时任务
   *
   * 如果修改了 cron 表达式或状态，需要同步更新调度引擎
   */
  async updateJob(id: number, params: UpdateCronJobParams): Promise<CronJobEntity> {
    const job = await this.jobRepo.findOne({ where: { id } })
    if (!job) throw new NotFoundException('任务不存在')

    // 如果修改了 handler，校验新 handler 是否已注册
    if (params.handler && !this.handlerRegistry.hasHandler(params.handler)) {
      throw new BadRequestException(`处理器「${params.handler}」未注册`)
    }

    // 如果修改了 cron 表达式，校验格式
    if (params.cronExpression) {
      this.validateCronExpression(params.cronExpression)
    }

    // 合并更新字段
    const needReschedule = params.cronExpression !== undefined || params.status !== undefined

    if (params.name !== undefined) job.name = params.name
    if (params.group !== undefined) job.group = params.group
    if (params.cronExpression !== undefined) job.cronExpression = params.cronExpression
    if (params.handler !== undefined) job.handler = params.handler
    if (params.params !== undefined) job.params = (params.params || null) as string | null
    if (params.description !== undefined) job.description = params.description
    if (params.concurrent !== undefined) job.concurrent = params.concurrent
    if (params.misfirePolicy !== undefined) job.misfirePolicy = params.misfirePolicy
    if (params.status !== undefined) job.status = params.status

    const saved = await this.jobRepo.save(job)

    // 同步调度引擎
    if (needReschedule) {
      // 先移除旧的调度
      this.cronScheduler.removeCronJob(id)
      // 如果新状态为启用，重新注册
      if (saved.status === 1) {
        this.cronScheduler.addCronJob(saved)
      }
    }

    return saved
  }

  /**
   * 删除定时任务
   *
   * 同时移除调度引擎中的调度
   */
  async deleteJob(id: number): Promise<{ id: number }> {
    const job = await this.jobRepo.findOne({ where: { id } })
    if (!job) throw new NotFoundException('任务不存在')

    // 移除调度
    this.cronScheduler.removeCronJob(id)
    // 删除数据库记录
    await this.jobRepo.delete(id)
    return { id }
  }

  /**
   * 切换任务启用/暂停状态
   */
  async toggleJobStatus(id: number): Promise<CronJobEntity> {
    const job = await this.jobRepo.findOne({ where: { id } })
    if (!job) throw new NotFoundException('任务不存在')

    // 移除旧调度
    this.cronScheduler.removeCronJob(id)

    // 切换状态
    job.status = job.status === 1 ? 0 : 1
    const saved = await this.jobRepo.save(job)

    // 如果启用，重新注册
    if (saved.status === 1) {
      this.cronScheduler.addCronJob(saved)
    }

    return saved
  }

  /**
   * 手动触发一次任务执行
   */
  async triggerJob(id: number) {
    const job = await this.jobRepo.findOne({ where: { id } })
    if (!job) throw new NotFoundException('任务不存在')

    // 直接调用调度引擎执行
    const log = await this.cronScheduler.executeJob(id, true)
    return log
  }

  // ============ 处理器信息 ============

  /**
   * 获取所有可用的处理器列表
   */
  getHandlers() {
    return this.handlerRegistry.getHandlerList()
  }

  // ============ 执行日志 ============

  /**
   * 分页查询某个任务的执行日志
   */
  async findLogs(params: QueryCronLogParams): Promise<PageResult<CronLogEntity>> {
    const { page = 1, size = 10, jobId, status } = params

    const qb = this.logRepo
      .createQueryBuilder('l')
      .where('l.job_id = :jobId', { jobId })
      .orderBy('l.id', 'DESC')

    // 按状态筛选
    if (status === 0 || status === 1 || status === 2) {
      qb.andWhere('l.status = :status', { status })
    }

    return paginate(qb, page, size)
  }

  /**
   * 清空某个任务的执行日志
   */
  async clearLogs(jobId: number): Promise<{ count: number }> {
    const result = await this.logRepo.delete({ jobId })
    return { count: result.affected || 0 }
  }

  // ============ 校验工具 ============

  /**
   * 校验 cron 表达式是否合法
   *
   * 支持 6 位（秒级）格式，使用 cron 库进行校验
   */
  private validateCronExpression(expression: string): void {
    try {
      // 使用 cron@4.x 的 CronJob.from 校验表达式（不启动）
      CronJobLib.from({ cronTime: expression, onTick: () => {}, start: false })
    } catch (error) {
      throw new BadRequestException(
        `Cron 表达式格式错误：${error instanceof Error ? error.message : '无效格式'}`,
      )
    }
  }
}
