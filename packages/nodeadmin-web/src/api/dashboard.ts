/**
 * Dashboard 统计 API 模块
 *
 * 对接 /api/admin/dashboard/stats，获取首页统计卡数据。
 */
import request from './request'
import type { ApiResponse } from '@nodeadmin/shared'

/** Dashboard 统计响应结构 */
export interface DashboardStats {
  /** 用户总数 */
  userCount: number
  /** 角色总数 */
  roleCount: number
  /** 菜单 + 按钮总数 */
  menuCount: number
  /** 字典项总数 */
  dictCount: number
}

/**
 * 获取 Dashboard 统计数据
 */
export const getDashboardStats = () =>
  request.get<ApiResponse<DashboardStats>>('/api/admin/dashboard/stats')
