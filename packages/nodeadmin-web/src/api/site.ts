/**
 * 站点配置 API 模块
 *
 * 对接 /api/admin/site 和 /api/public/site 接口。
 * 管理端接口需要登录态，公开接口用于登录页获取标题和背景图。
 */
import request from './request'
import type { ApiResponse, SiteConfig, SiteConfigPublic, UpdateSiteDto } from '@nodeadmin/shared'

/**
 * 管理端：获取完整站点配置
 * @returns 站点完整配置（含 title、loginBg）
 */
export const getAdminSite = () => request.get<ApiResponse<SiteConfig>>('/api/admin/site')

/**
 * 管理端：更新站点配置
 * @param data 更新 DTO（title、loginBg 可选）
 * @returns 更新后的完整配置
 */
export const updateSite = (data: UpdateSiteDto) =>
  request.put<ApiResponse<SiteConfig>>('/api/admin/site', data)

/**
 * 公开端：获取公开站点配置（登录页用，无需登录）
 * 后端通过 TransformInterceptor 统一包装为 ApiResponse 格式
 * @returns 站点公开配置（title、loginBg）
 */
export const getPublicSite = () => request.get<ApiResponse<SiteConfigPublic>>('/api/public/site')
