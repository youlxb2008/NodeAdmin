/**
 * 角色管理 API 模块
 *
 * 对接 /api/admin/roles 全部接口，支持 list/all/get/create/update/delete/assignMenus。
 */
import request from './request'
import type {
  ApiResponse,
  PageResponse,
  Role,
  RoleWithMenus,
  CreateRoleDto,
  UpdateRoleDto,
  AssignMenusDto,
} from '@nodeadmin/shared'

/**
 * 角色列表（分页）
 * @param params 含 page/size/keyword/status
 */
export const getRoleList = (params: {
  page: number
  size: number
  keyword?: string
  status?: number
}) => request.get<PageResponse<Role>>('/api/admin/roles', { params })

/**
 * 全部角色（无分页，用于分配角色下拉 / 穿梭框）
 */
export const getAllRoles = () => request.get<ApiResponse<Role[]>>('/api/admin/roles/all')

/**
 * 角色详情
 * @param id 角色 ID
 */
export const getRoleById = (id: number) => request.get<RoleWithMenus>(`/api/admin/roles/${id}`)

/**
 * 新建角色
 * @param data 创建角色 DTO
 */
export const createRole = (data: CreateRoleDto) =>
  request.post<ApiResponse<Role>>('/api/admin/roles', data)

/**
 * 更新角色
 * @param id 角色 ID
 * @param data 更新角色 DTO
 */
export const updateRole = (id: number, data: UpdateRoleDto) =>
  request.put<ApiResponse<Role>>(`/api/admin/roles/${id}`, data)

/**
 * 删除角色
 * @param id 角色 ID
 */
export const deleteRole = (id: number) =>
  request.delete<ApiResponse<null>>(`/api/admin/roles/${id}`)

/**
 * 分配菜单（全量覆盖）
 * @param id 角色 ID
 * @param data { menuIds: number[] }
 */
export const assignRoleMenus = (id: number, data: AssignMenusDto) =>
  request.put<ApiResponse<null>>(`/api/admin/roles/${id}/menus`, data)
