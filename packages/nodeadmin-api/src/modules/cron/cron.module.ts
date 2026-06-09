/**
 * 定时任务模块（CronModule）
 *
 * 注册定时任务相关的 Controller / Service / Scheduler / Handler，
 * 导入 CronJobEntity 和 CronLogEntity 以支持 TypeORM 注入，
 * 导入 ScheduleModule 启用 NestJS 调度能力。
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
import { CronJobEntity } from '../../entities/cron-job.entity'
import { CronLogEntity } from '../../entities/cron-log.entity'
import { CronController } from './cron.controller'
import { CronService } from './cron.service'
import { CronScheduler } from './cron.scheduler'
import { CronHandlerRegistry } from './cron.handler'

@Module({
  imports: [
    // 启用 NestJS 调度模块
    ScheduleModule.forRoot(),
    // 注册实体
    TypeOrmModule.forFeature([CronJobEntity, CronLogEntity]),
  ],
  controllers: [CronController],
  providers: [CronService, CronScheduler, CronHandlerRegistry],
  exports: [CronService, CronScheduler, CronHandlerRegistry],
})
export class CronModule {}
