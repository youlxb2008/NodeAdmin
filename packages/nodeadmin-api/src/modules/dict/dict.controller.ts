/**
 * 字典控制器（DictController）
 *
 * 路由前缀：/api/admin/dicts
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
import { DictService } from './dict.service'
import type { CreateDictParams, QueryDictParams, UpdateDictParams } from './dict.service'
import { successPage } from '../../common/utils/response.util'

@Controller('admin/dicts')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  /** 分页查询字典列表 */
  @Get()
  async findAll(@Query() query: QueryDictParams) {
    const page = Number(query.page) || 1
    const size = Number(query.size) || 10
    const rawStatus = query.status as unknown as string
    const status =
      rawStatus !== undefined && rawStatus !== '' ? Number(rawStatus) : undefined

    const result = await this.dictService.findAll({
      page,
      size,
      type: query.type,
      status,
      keyword: query.keyword,
    })
    return successPage(result.data, result.total, result.page, result.size)
  }

  /**
   * 按类型获取字典项（不分页）
   * 前端表单下拉选择器使用
   */
  @Get('by-type/:type')
  async findByType(@Param('type') type: string) {
    return this.dictService.findByType(type)
  }

  /** 创建字典项 */
  @Post()
  async create(@Body() body: CreateDictParams) {
    return this.dictService.create(body)
  }

  /** 更新字典项 */
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateDictParams) {
    return this.dictService.update(id, body)
  }

  /** 删除字典项 */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.remove(id)
  }
}
