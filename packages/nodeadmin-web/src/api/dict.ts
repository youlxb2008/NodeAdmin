/**
 * 字典管理 API 模块
 *
 * 对接 /api/admin/dicts 接口，含分页列表、by-type、CRUD。
 */
import request from './request'
import type {
  ApiResponse,
  PageResponse,
  Dict,
  CreateDictDto,
  UpdateDictDto,
} from '@nodeadmin/shared'

/**
 * 字典列表（分页）
 * @param params 含 page/size/type/status
 */
export const getDictList = (params: {
  page: number
  size: number
  type?: string
  status?: number
}) => request.get<PageResponse<Dict>>('/api/admin/dicts', { params })

/**
 * 按类型获取字典项（无分页，全部返回，供表单下拉使用）
 * @param type 字典类型编码
 */
export const getDictByType = (type: string) =>
  request.get<ApiResponse<Dict[]>>(`/api/admin/dicts/by-type/${type}`)

/**
 * 新建字典项
 * @param data 创建字典 DTO
 */
export const createDict = (data: CreateDictDto) =>
  request.post<ApiResponse<Dict>>('/api/admin/dicts', data)

/**
 * 更新字典项
 * @param id 字典 ID
 * @param data 更新字典 DTO
 */
export const updateDict = (id: number, data: UpdateDictDto) =>
  request.put<ApiResponse<Dict>>(`/api/admin/dicts/${id}`, data)

/**
 * 删除字典项
 * @param id 字典 ID
 */
export const deleteDict = (id: number) =>
  request.delete<ApiResponse<null>>(`/api/admin/dicts/${id}`)
