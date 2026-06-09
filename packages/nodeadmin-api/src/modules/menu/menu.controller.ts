/**
 * 菜单控制器（MenuController）
 *
 * 路由前缀：/api/admin/menus
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
import { MenuService } from './menu.service'
import type { CreateMenuParams, UpdateMenuParams } from './menu.service'

@Controller('admin/menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * 获取全量菜单树
   * 用于「分配菜单」弹窗（不过滤当前用户权限）
   */
  @Get('tree')
  async getTree() {
    return this.menuService.getTree()
  }

  /**
   * 获取菜单平铺列表
   * @param status 可选状态筛选
   */
  @Get()
  async findAll(@Query('status') status?: string) {
    const s = status !== undefined && status !== '' ? Number(status) : undefined
    return this.menuService.findAll(s)
  }

  /** 创建菜单 / 按钮 */
  @Post()
  async create(@Body() body: CreateMenuParams) {
    return this.menuService.create(body)
  }

  /** 更新菜单 / 按钮 */
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateMenuParams) {
    return this.menuService.update(id, body)
  }

  /**
   * 删除菜单
   * 业务规则：有子菜单或被角色关联时禁止删除
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.remove(id)
  }
}
