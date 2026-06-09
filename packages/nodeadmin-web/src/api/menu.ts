/**
 * 菜单管理 API 模块
 *
 * 对接 /api/admin/menus 接口，含 tree 与 CRUD。
 */
import request from './request'
import type {
  ApiResponse,
  Menu,
  MenuTreeNode,
  CreateMenuDto,
  UpdateMenuDto,
} from '@nodeadmin/shared'

/**
 * 菜单树（嵌套结构，树形表格 + 分配菜单用）
 */
export const getMenuTree = () => request.get<ApiResponse<MenuTreeNode[]>>('/api/admin/menus/tree')

/**
 * 菜单列表（扁平，按 sort 排序）
 */
export const getMenuList = () => request.get<ApiResponse<Menu[]>>('/api/admin/menus')

/**
 * 新建菜单
 * @param data 创建菜单 DTO
 */
export const createMenu = (data: CreateMenuDto) =>
  request.post<ApiResponse<Menu>>('/api/admin/menus', data)

/**
 * 更新菜单
 * @param id 菜单 ID
 * @param data 更新菜单 DTO
 */
export const updateMenu = (id: number, data: UpdateMenuDto) =>
  request.put<ApiResponse<Menu>>(`/api/admin/menus/${id}`, data)

/**
 * 删除菜单
 * @param id 菜单 ID
 */
export const deleteMenu = (id: number) =>
  request.delete<ApiResponse<null>>(`/api/admin/menus/${id}`)
