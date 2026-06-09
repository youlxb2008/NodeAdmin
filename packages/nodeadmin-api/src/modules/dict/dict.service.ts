/**
 * 字典服务（DictService）
 *
 * 字典用于维护可枚举的业务取值（如「性别」「订单状态」），
 * 同一 type 下含多条 label/value 选项。
 */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DictEntity } from '../../entities/dict.entity'
import { paginate, PageResult } from '../../common/utils/pagination.util'

/** 查询参数 */
export interface QueryDictParams {
  page?: number
  size?: number
  type?: string
  status?: number
  keyword?: string
}

/** 创建字典项参数 */
export interface CreateDictParams {
  type: string
  label: string
  value: string
  sort?: number
  status?: number
  remark?: string
}

/** 更新字典项参数 */
export interface UpdateDictParams {
  type?: string
  label?: string
  value?: string
  sort?: number
  status?: number
  remark?: string
}

@Injectable()
export class DictService {
  constructor(
    @InjectRepository(DictEntity)
    private readonly dictRepo: Repository<DictEntity>,
  ) {}

  /**
   * 分页查询字典列表
   * 支持按 type / status 过滤，按 label / value 模糊检索
   */
  async findAll(params: QueryDictParams): Promise<PageResult<DictEntity>> {
    const { page = 1, size = 10, type, status, keyword } = params

    const qb = this.dictRepo
      .createQueryBuilder('d')
      .orderBy('d.type', 'ASC')
      .addOrderBy('d.sort', 'DESC')

    if (type && type.trim()) {
      qb.andWhere('d.type = :type', { type: type.trim() })
    }
    if (status === 0 || status === 1) {
      qb.andWhere('d.status = :status', { status })
    }
    if (keyword && keyword.trim()) {
      qb.andWhere('(d.label LIKE :kw OR d.value LIKE :kw)', {
        kw: `%${keyword.trim()}%`,
      })
    }

    return paginate(qb, page, size)
  }

  /**
   * 按类型获取所有字典项（不分页）
   * 用于前端下拉选择器：只返回启用项，按 sort DESC 排序
   */
  async findByType(type: string): Promise<DictEntity[]> {
    return this.dictRepo.find({
      where: { type, status: 1 },
      order: { sort: 'DESC', id: 'ASC' },
    })
  }

  /** 查询单个字典项 */
  async findOne(id: number): Promise<DictEntity> {
    const dict = await this.dictRepo.findOne({ where: { id } })
    if (!dict) throw new NotFoundException('字典项不存在')
    return dict
  }

  /** 创建字典项 */
  async create(params: CreateDictParams): Promise<DictEntity> {
    if (!params.type || !params.label || params.value === undefined) {
      throw new BadRequestException('字典类型、显示文本、取值不能为空')
    }
    const dict = this.dictRepo.create({
      type: params.type,
      label: params.label,
      value: params.value,
      sort: params.sort ?? 0,
      status: params.status ?? 1,
      remark: params.remark || '',
    })
    return this.dictRepo.save(dict)
  }

  /** 更新字典项 */
  async update(id: number, params: UpdateDictParams): Promise<DictEntity> {
    const dict = await this.dictRepo.findOne({ where: { id } })
    if (!dict) throw new NotFoundException('字典项不存在')

    if (params.type !== undefined) dict.type = params.type
    if (params.label !== undefined) dict.label = params.label
    if (params.value !== undefined) dict.value = params.value
    if (params.sort !== undefined) dict.sort = params.sort
    if (params.status !== undefined) dict.status = params.status
    if (params.remark !== undefined) dict.remark = params.remark

    return this.dictRepo.save(dict)
  }

  /** 删除字典项 */
  async remove(id: number): Promise<{ id: number }> {
    const dict = await this.dictRepo.findOne({ where: { id } })
    if (!dict) throw new NotFoundException('字典项不存在')
    await this.dictRepo.delete(id)
    return { id }
  }
}
