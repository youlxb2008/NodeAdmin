/**
 * 角色控制器（RoleController）
 *
 * 路由前缀：/api/admin/roles
 * 全部受全局 JwtAccessGuard 保护。
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { RoleService } from './role.service'
import type { CreateRoleParams, QueryRoleParams, UpdateRoleParams } from './role.service'
import { successPage } from '../../common/utils/response.util'

@Controller('admin/roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /** 分页查询角色列表 */
  @Get()
  async findAll(@Query() query: QueryRoleParams) {
    const page = Number(query.page) || 1
    const size = Number(query.size) || 10
    const rawStatus = query.status as unknown as string
    const status = rawStatus !== undefined && rawStatus !== '' ? Number(rawStatus) : undefined

    const result = await this.roleService.findAll({
      page,
      size,
      keyword: query.keyword,
      status,
    })
    return successPage(result.data, result.total, result.page, result.size)
  }

  /**
   * 查询所有角色（不分页）
   * 用于前端「分配角色」下拉选择器
   */
  @Get('all')
  async findAllList() {
    return this.roleService.findAllList()
  }

  /** 查询单个角色详情（含菜单列表） */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findOne(id)
  }

  /** 创建角色 */
  @Post()
  async create(@Body() body: CreateRoleParams) {
    return this.roleService.create(body)
  }

  /** 更新角色 */
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateRoleParams) {
    return this.roleService.update(id, body)
  }

  /**
   * 删除角色
   * 若仍有用户关联则抛 ROLE_IN_USE 错误码
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.remove(id)
  }

  /** 分配菜单权限（全量覆盖） */
  @Put(':id/menus')
  async assignMenus(@Param('id', ParseIntPipe) id: number, @Body() body: { menuIds: number[] }) {
    return this.roleService.assignMenus(id, body.menuIds || [])
  }
}
