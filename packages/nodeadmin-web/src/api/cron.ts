/**
 * 定时任务 API 模块
 *
 * 对接 /api/admin/cron 接口，含任务 CRUD、状态切换、手动触发、执行日志。
 */
import request from './request'
import type {
  ApiResponse,
  PageResponse,
  CronJob,
  CronLog,
  CreateCronJobDto,
  UpdateCronJobDto,
  CronHandlerInfo,
} from '@nodeadmin/shared'

// ============ 任务管理 ============

/**
 * 任务列表（分页）
 * @param params 含 page/size/name/group/status
 */
export const getCronJobList = (params: {
  page: number
  size: number
  name?: string
  group?: string
  status?: number
}) => request.get<PageResponse<CronJob>>('/api/admin/cron/jobs', { params })

/**
 * 获取所有可用的处理器列表
 */
export const getCronHandlers = () =>
  request.get<ApiResponse<CronHandlerInfo[]>>('/api/admin/cron/handlers')

/**
 * 创建定时任务
 * @param data 创建任务 DTO
 */
export const createCronJob = (data: CreateCronJobDto) =>
  request.post<ApiResponse<CronJob>>('/api/admin/cron/jobs', data)

/**
 * 更新定时任务
 * @param id 任务 ID
 * @param data 更新任务 DTO
 */
export const updateCronJob = (id: number, data: UpdateCronJobDto) =>
  request.put<ApiResponse<CronJob>>(`/api/admin/cron/jobs/${id}`, data)

/**
 * 删除定时任务
 * @param id 任务 ID
 */
export const deleteCronJob = (id: number) =>
  request.delete<ApiResponse<null>>(`/api/admin/cron/jobs/${id}`)

/**
 * 切换任务启用/暂停状态
 * @param id 任务 ID
 */
export const toggleCronJobStatus = (id: number) =>
  request.put<ApiResponse<CronJob>>(`/api/admin/cron/jobs/${id}/status`)

/**
 * 手动触发一次任务执行
 * @param id 任务 ID
 */
export const triggerCronJob = (id: number) =>
  request.put<ApiResponse<CronLog>>(`/api/admin/cron/jobs/${id}/trigger`)

// ============ 执行日志 ============

/**
 * 查询任务的执行日志（分页）
 * @param jobId 任务 ID
 * @param params 含 page/size/status
 */
export const getCronLogs = (
  jobId: number,
  params: { page: number; size: number; status?: number },
) => request.get<PageResponse<CronLog>>(`/api/admin/cron/jobs/${jobId}/logs`, { params })

/**
 * 清空任务的执行日志
 * @param jobId 任务 ID
 */
export const clearCronLogs = (jobId: number) =>
  request.delete<ApiResponse<{ count: number }>>(`/api/admin/cron/jobs/${jobId}/logs`)
