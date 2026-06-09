/**
 * 定时任务执行日志实体（cron_logs 表）
 *
 * 记录每次任务执行的详细信息，包括状态、耗时、结果和错误信息。
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { CronJobEntity } from './cron-job.entity'

/** 执行状态枚举 */
export enum CronLogStatus {
  /** 执行中 */
  RUNNING = 2,
  /** 成功 */
  SUCCESS = 1,
  /** 失败 */
  FAILED = 0,
}

@Entity('cron_logs')
@Index('idx_cron_log_job_id', ['jobId'])
@Index('idx_cron_log_status', ['status'])
@Index('idx_cron_log_created', ['createdAt'])
export class CronLogEntity {
  /** 日志主键 ID */
  @PrimaryGeneratedColumn()
  id: number

  /** 关联的任务 ID */
  @Column({ type: 'int', name: 'job_id' })
  jobId: number

  /** 执行状态：0=失败 1=成功 2=执行中 */
  @Column({ type: 'int', default: CronLogStatus.RUNNING })
  status: number

  /** 执行开始时间 */
  @Column({ type: 'datetime', name: 'start_time' })
  startTime: Date

  /** 执行结束时间 */
  @Column({ type: 'datetime', nullable: true, name: 'end_time' })
  endTime: Date | null

  /** 执行耗时（毫秒） */
  @Column({ type: 'int', nullable: true })
  duration: number | null

  /** 执行结果（成功时的返回信息） */
  @Column({ type: 'text', nullable: true })
  result: string | null

  /** 错误信息（失败时的错误堆栈或消息） */
  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string | null

  /** 创建时间（自动维护） */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  /** 关联的任务实体（用于查询时关联） */
  @ManyToOne(() => CronJobEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: CronJobEntity
}
