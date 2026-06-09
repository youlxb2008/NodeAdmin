/**
 * 用户管理 API 模块
 *
 * 对接 /api/admin/users 全部接口，使用 shared 类型。
 */
import request from './request'
import type {
  ApiResponse,
  PageResponse,
  User,
  CreateUserDto,
  UpdateUserDto,
  AssignRolesDto,
} from '@nodeadmin/shared'

/**
 * 用户列表（分页）
 * @param params 含 page/size/keyword/status
 */
export const getUserList = (params: {
  page: number
  size: number
  keyword?: string
  status?: number
}) => request.get<PageResponse<User>>('/api/admin/users', { params })

/**
 * 用户详情
 * @param id 用户 ID
 */
export const getUserById = (id: number) => request.get<ApiResponse<User>>(`/api/admin/users/${id}`)

/**
 * 新建用户
 * @param data 创建用户 DTO
 */
export const createUser = (data: CreateUserDto) =>
  request.post<ApiResponse<User>>('/api/admin/users', data)

/**
 * 更新用户
 * @param id 用户 ID
 * @param data 更新用户 DTO
 */
export const updateUser = (id: number, data: UpdateUserDto) =>
  request.put<ApiResponse<User>>(`/api/admin/users/${id}`, data)

/**
 * 删除用户
 * @param id 用户 ID
 */
export const deleteUser = (id: number) =>
  request.delete<ApiResponse<null>>(`/api/admin/users/${id}`)

/**
 * 分配角色（全量覆盖）
 * @param id 用户 ID
 * @param data { roleIds: number[] }
 */
export const assignUserRoles = (id: number, data: AssignRolesDto) =>
  request.put<ApiResponse<null>>(`/api/admin/users/${id}/roles`, data)
