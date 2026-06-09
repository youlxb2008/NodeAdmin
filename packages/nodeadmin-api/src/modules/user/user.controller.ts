/**
 * 用户控制器（UserController）
 *
 * 路由前缀：/api/admin/users
 * 由全局 JwtAccessGuard 默认保护（无 @Public 装饰器即必须登录）。
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
import { UserService } from './user.service'
import type { CreateUserParams, QueryUserParams, UpdateUserParams } from './user.service'
import { successPage } from '../../common/utils/response.util'

@Controller('admin/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 分页查询用户列表
   *
   * @example GET /api/admin/users?page=1&size=10&keyword=admin&status=1
   */
  @Get()
  async findAll(@Query() query: QueryUserParams) {
    // Query 字符串到数字的转换：page / size / status 可能是 string
    const page = Number(query.page) || 1
    const size = Number(query.size) || 10
    // status 空字符串 / 未传都不过滤；仅 '0' / '1' 才作为筛选条件
    const rawStatus = query.status as unknown as string
    const status = rawStatus !== undefined && rawStatus !== '' ? Number(rawStatus) : undefined

    const result = await this.userService.findAll({
      page,
      size,
      keyword: query.keyword,
      status,
    })
    // 分页接口自行包装为 successPage 格式（TransformInterceptor 不会二次包装）
    return successPage(result.data, result.total, result.page, result.size)
  }

  /** 获取单个用户详情（含角色） */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id)
  }

  /** 创建用户 */
  @Post()
  async create(@Body() body: CreateUserParams) {
    return this.userService.create(body)
  }

  /** 更新用户（含可选 password / roleIds） */
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserParams) {
    return this.userService.update(id, body)
  }

  /**
   * 删除用户
   * 业务规则：禁止删除 id=1 超管账号（由 service 抛出 BadRequestException）
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id)
  }

  /** 单独分配角色（替代在更新接口中传 roleIds 的轻量入口） */
  @Put(':id/roles')
  async assignRoles(@Param('id', ParseIntPipe) id: number, @Body() body: { roleIds: number[] }) {
    return this.userService.assignRoles(id, body.roleIds || [])
  }
}
