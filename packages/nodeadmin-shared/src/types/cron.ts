/**
 * 定时任务相关类型定义
 *
 * 前后端共用的定时任务数据结构，包括任务实体、日志实体、DTO 等。
 */

import type { PageQuery } from './common'

/**
 * 定时任务实体（对应 cron_jobs 表）
 */
export interface CronJob {
  /** 任务主键 ID */
  id: number
  /** 任务名称 */
  name: string
  /** 任务分组 */
  group: string
  /** Cron 表达式（6 位秒级） */
  cronExpression: string
  /** 任务处理器名称 */
  handler: string
  /** 任务参数（JSON 格式字符串） */
  params: string | null
  /** 任务描述 */
  description: string
  /** 状态：0=暂停 1=启用 */
  status: number
  /** 是否允许并发：0=不允许 1=允许 */
  concurrent: number
  /** 过期执行策略：1=立即执行 2=放弃 3=仅执行一次 */
  misfirePolicy: number
  /** 最后执行时间 */
  lastExecuteTime: string | null
  /** 下次执行时间 */
  nextExecuteTime: string | null
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/**
 * 定时任务执行日志（对应 cron_logs 表）
 */
export interface CronLog {
  /** 日志主键 ID */
  id: number
  /** 关联的任务 ID */
  jobId: number
  /** 执行状态：0=失败 1=成功 2=执行中 */
  status: number
  /** 执行开始时间 */
  startTime: string
  /** 执行结束时间 */
  endTime: string | null
  /** 执行耗时（毫秒） */
  duration: number | null
  /** 执行结果 */
  result: string | null
  /** 错误信息 */
  errorMessage: string | null
  /** 创建时间 */
  createdAt: string
}

/**
 * 创建定时任务请求体
 */
export interface CreateCronJobDto {
  /** 任务名称 */
  name: string
  /** 任务分组 */
  group?: string
  /** Cron 表达式 */
  cronExpression: string
  /** 任务处理器名称 */
  handler: string
  /** 任务参数（JSON 格式） */
  params?: string
  /** 任务描述 */
  description?: string
  /** 是否允许并发 */
  concurrent?: number
  /** 过期执行策略 */
  misfirePolicy?: number
  /** 状态 */
  status?: number
}

/**
 * 更新定时任务请求体（部分更新）
 */
export interface UpdateCronJobDto {
  /** 任务名称 */
  name?: string
  /** 任务分组 */
  group?: string
  /** Cron 表达式 */
  cronExpression?: string
  /** 任务处理器名称 */
  handler?: string
  /** 任务参数（JSON 格式） */
  params?: string
  /** 任务描述 */
  description?: string
  /** 是否允许并发 */
  concurrent?: number
  /** 过期执行策略 */
  misfirePolicy?: number
  /** 状态 */
  status?: number
}

/**
 * 定时任务查询参数
 */
export interface QueryCronJobDto extends PageQuery {
  /** 按任务名称模糊检索 */
  name?: string
  /** 按分组筛选 */
  group?: string
  /** 按状态筛选 */
  status?: number
}

/**
 * 执行日志查询参数
 */
export interface QueryCronLogDto extends PageQuery {
  /** 按执行状态筛选 */
  status?: number
}

/**
 * 处理器信息（用于前端选择处理器下拉框）
 */
export interface CronHandlerInfo {
  /** 处理器名称 */
  name: string
  /** 处理器描述 */
  description: string
}
