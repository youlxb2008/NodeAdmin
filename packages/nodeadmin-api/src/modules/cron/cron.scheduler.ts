/**
 * 定时任务调度引擎（CronScheduler）
 *
 * 核心职责：
 *   1. 服务启动时从数据库加载所有启用的任务，动态注册 cron 调度
 *   2. 提供添加/删除/更新任务的调度管理能力
 *   3. 执行任务时调用对应的 handler，并记录执行日志
 *   4. 并发控制：通过内存 Set 记录正在执行的任务 ID
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { CronJobEntity } from '../../entities/cron-job.entity'
import { CronLogEntity, CronLogStatus } from '../../entities/cron-log.entity'
import { CronHandlerRegistry } from './cron.handler'

@Injectable()
export class CronScheduler implements OnModuleInit {
  private readonly logger = new Logger(CronScheduler.name)

  /** 正在执行的任务 ID 集合（用于并发控制） */
  private readonly runningJobs = new Set<number>()

  constructor(
    @InjectRepository(CronJobEntity)
    private readonly jobRepo: Repository<CronJobEntity>,
    @InjectRepository(CronLogEntity)
    private readonly logRepo: Repository<CronLogEntity>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly handlerRegistry: CronHandlerRegistry,
  ) {}

  /**
   * 服务启动时加载所有启用的任务并注册调度
   */
  async onModuleInit(): Promise<void> {
    const jobs = await this.jobRepo.find({ where: { status: 1 } })
    this.logger.log(`加载 ${jobs.length} 个启用的定时任务`)

    for (const job of jobs) {
      this.addCronJob(job)
    }
  }

  /**
   * 添加一个 cron 调度任务
   *
   * @param job 任务实体
   */
  addCronJob(job: CronJobEntity): void {
    const jobName = this.getJobName(job.id)

    // 如果已存在同名调度，先删除
    try {
      this.schedulerRegistry.deleteCronJob(jobName)
    } catch {
      // 不存在则忽略
    }

    // 创建 cron 实例（cron@4.x 使用 CronJob.from 静态方法）
    const cronJob = CronJob.from({
      cronTime: job.cronExpression,
      onTick: () => {
        this.executeJob(job.id).catch(err => {
          this.logger.error(`任务「${job.name}」执行异常：${err.message}`, err.stack)
        })
      },
      start: false,
    })

    // 注册到 NestJS 调度器
    this.schedulerRegistry.addCronJob(jobName, cronJob)
    cronJob.start()

    // 更新下次执行时间
    this.updateNextExecuteTime(job.id, cronJob)

    this.logger.log(`注册定时任务「${job.name}」(${job.cronExpression})`)
  }

  /**
   * 删除一个 cron 调度任务
   */
  removeCronJob(jobId: number): void {
    const jobName = this.getJobName(jobId)
    try {
      this.schedulerRegistry.deleteCronJob(jobName)
      this.logger.log(`移除定时任务调度 [ID=${jobId}]`)
    } catch {
      // 不存在则忽略
    }
  }

  /**
   * 执行指定任务（核心执行逻辑）
   *
   * 流程：
   *   1. 并发检查：如果任务不允许并发且正在执行，跳过
   *   2. 从数据库重新读取最新任务配置
   *   3. 创建执行日志记录（状态=执行中）
   *   4. 调用 handler 执行业务逻辑
   *   5. 更新日志状态和任务最后执行时间
   *
   * @param jobId 任务 ID
   * @param isManual 是否为手动触发
   */
  async executeJob(jobId: number, isManual = false): Promise<CronLogEntity> {
    // 并发控制：如果任务不允许并发且正在执行，跳过
    if (this.runningJobs.has(jobId)) {
      const job = await this.jobRepo.findOne({ where: { id: jobId } })
      if (job && !job.concurrent) {
        this.logger.warn(`任务「${job.name}」正在执行中，跳过本次触发`)
        // 返回一条跳过日志
        const skipLog = this.logRepo.create({
          jobId,
          status: CronLogStatus.FAILED,
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          result: '任务正在执行中，跳过本次触发',
        })
        return this.logRepo.save(skipLog)
      }
    }

    // 标记为正在执行
    this.runningJobs.add(jobId)

    // 读取最新任务配置
    const job = await this.jobRepo.findOne({ where: { id: jobId } })
    if (!job) {
      this.runningJobs.delete(jobId)
      throw new Error(`任务 ID=${jobId} 不存在`)
    }

    // 解析参数
    let params: Record<string, unknown> | undefined
    if (job.params) {
      try {
        params = JSON.parse(job.params)
      } catch {
        params = undefined
      }
    }

    // 创建执行日志（状态=执行中）
    const logEntry = this.logRepo.create({
      jobId: job.id,
      status: CronLogStatus.RUNNING,
      startTime: new Date(),
    })
    const log = await this.logRepo.save(logEntry)
    const startTime = Date.now()

    try {
      // 查找并执行 handler
      const handlerFn = this.handlerRegistry.getHandler(job.handler)
      if (!handlerFn) {
        throw new Error(`处理器「${job.handler}」未注册`)
      }

      const result = await handlerFn(params)

      // 特殊处理：cleanExpiredLogs 需要在此执行实际删除
      if (typeof result === 'string' && result.startsWith('CLEAN_LOGS:')) {
        const days = parseInt(result.split(':')[1], 10)
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)
        const deleteResult = await this.logRepo
          .createQueryBuilder()
          .delete()
          .where('created_at < :cutoff', { cutoff })
          .execute()
        const finalResult = `清理了 ${deleteResult.affected || 0} 条过期日志（${days} 天前）`

        // 更新日志
        log.status = CronLogStatus.SUCCESS
        log.endTime = new Date()
        log.duration = Date.now() - startTime
        log.result = finalResult
        await this.logRepo.save(log)

        // 更新任务最后执行时间
        await this.updateLastExecuteTime(job.id)
        return log
      }

      // 更新日志为成功
      log.status = CronLogStatus.SUCCESS
      log.endTime = new Date()
      log.duration = Date.now() - startTime
      log.result = typeof result === 'string' ? result : JSON.stringify(result)
      await this.logRepo.save(log)

      // 更新任务最后执行时间
      await this.updateLastExecuteTime(job.id)

      this.logger.log(`任务「${job.name}」执行成功，耗时 ${log.duration}ms`)
      return log
    } catch (error) {
      // 更新日志为失败
      log.status = CronLogStatus.FAILED
      log.endTime = new Date()
      log.duration = Date.now() - startTime
      log.errorMessage = error instanceof Error ? error.message : String(error)
      await this.logRepo.save(log)

      // 仍然更新最后执行时间
      await this.updateLastExecuteTime(job.id)

      this.logger.error(
        `任务「${job.name}」执行失败：${error instanceof Error ? error.message : error}`,
      )
      return log
    } finally {
      // 移除执行标记
      this.runningJobs.delete(jobId)
    }
  }

  /**
   * 更新任务的最后执行时间
   */
  private async updateLastExecuteTime(jobId: number): Promise<void> {
    await this.jobRepo.update(jobId, {
      lastExecuteTime: new Date(),
    })
  }

  /**
   * 更新任务的下次执行时间
   */
  private updateNextExecuteTime(jobId: number, cronJob: CronJob): void {
    const nextDate = cronJob.nextDate()
    if (nextDate) {
      this.jobRepo
        .update(jobId, {
          nextExecuteTime: nextDate.toJSDate(),
        })
        .catch(() => {
          // 静默处理更新失败
        })
    }
  }

  /**
   * 生成调度器中的任务名称
   */
  private getJobName(jobId: number): string {
    return `cron_job_${jobId}`
  }
}
