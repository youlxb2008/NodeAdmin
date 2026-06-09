/**
 * 定时任务实体（cron_jobs 表）
 *
 * 存储定时任务的配置信息，支持动态增删改查。
 * 服务启动时从该表加载所有启用的任务并注册到调度引擎。
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

@Entity('cron_jobs')
@Index('idx_cron_job_status', ['status'])
@Index('idx_cron_job_handler', ['handler'])
export class CronJobEntity {
  /** 任务主键 ID */
  @PrimaryGeneratedColumn()
  id: number

  /** 任务名称 */
  @Column({ type: 'varchar', length: 100 })
  name: string

  /** 任务分组（如：系统任务、数据任务） */
  @Column({ type: 'varchar', length: 50, default: 'default' })
  group: string

  /** Cron 表达式（6 位秒级，如 `0 0 2 * * *`） */
  @Column({ type: 'varchar', length: 50, name: 'cron_expression' })
  cronExpression: string

  /** 任务处理器名称（对应 CronHandlerRegistry 中注册的 handler） */
  @Column({ type: 'varchar', length: 100 })
  handler: string

  /** 任务参数（JSON 格式字符串，可选） */
  @Column({ type: 'text', nullable: true })
  params: string | null

  /** 任务描述 */
  @Column({ type: 'varchar', length: 255, default: '' })
  description: string

  /** 状态：0=暂停 1=启用 */
  @Column({ type: 'int', default: 1 })
  status: number

  /** 是否允许并发执行：0=不允许 1=允许 */
  @Column({ type: 'int', default: 0 })
  concurrent: number

  /**
   * 过期执行策略：
   *   1=立即执行（默认）
   *   2=放弃执行
   *   3=仅执行一次
   */
  @Column({ type: 'int', default: 1, name: 'misfire_policy' })
  misfirePolicy: number

  /** 最后执行时间 */
  @Column({ type: 'datetime', nullable: true, name: 'last_execute_time' })
  lastExecuteTime: Date | null

  /** 下次执行时间 */
  @Column({ type: 'datetime', nullable: true, name: 'next_execute_time' })
  nextExecuteTime: Date | null

  /** 创建时间（自动维护） */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  /** 更新时间（自动维护） */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
