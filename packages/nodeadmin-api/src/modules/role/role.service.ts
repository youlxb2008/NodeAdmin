/**
 * 角色服务（RoleService）
 *
 * 提供角色的增删改查、分页、菜单授权等核心业务逻辑。
 * 业务规则：
 *   - 角色编码 code 全局唯一
 *   - 删除角色前必须检查 user_roles 关联表为空，否则抛 ROLE_IN_USE
 *   - menuIds 全量覆盖语义
 */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { RoleEntity } from '../../entities/role.entity'
import { MenuEntity } from '../../entities/menu.entity'
import { UserRoleEntity } from '../../entities/user-role.entity'
import { RoleMenuEntity } from '../../entities/role-menu.entity'
import { ErrorCode } from '@nodeadmin/shared'
import { paginate, PageResult } from '../../common/utils/pagination.util'
import { isSuperAdminRole } from '../../common/utils/superadmin.util'

/** 列表查询参数 */
export interface QueryRoleParams {
  page?: number
  size?: number
  keyword?: string
  status?: number
}

/** 创建角色参数 */
export interface CreateRoleParams {
  code: string
  name: string
  status?: number
  sort?: number
  remark?: string
  menuIds?: number[]
}

/** 更新角色参数 */
export interface UpdateRoleParams {
  code?: string
  name?: string
  status?: number
  sort?: number
  remark?: string
  menuIds?: number[]
}

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(MenuEntity)
    private readonly menuRepo: Repository<MenuEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepo: Repository<UserRoleEntity>,
    @InjectRepository(RoleMenuEntity)
    private readonly roleMenuRepo: Repository<RoleMenuEntity>,
  ) {}

  /**
   * 分页查询角色列表
   * 支持按 code / name 模糊检索，按状态精确过滤；按 sort DESC 排序
   */
  async findAll(params: QueryRoleParams): Promise<PageResult<RoleEntity>> {
    const { page = 1, size = 10, keyword, status } = params

    const qb = this.roleRepo
      .createQueryBuilder('r')
      .orderBy('r.sort', 'DESC')
      .addOrderBy('r.id', 'DESC')

    if (keyword && keyword.trim()) {
      qb.andWhere('(r.code LIKE :kw OR r.name LIKE :kw)', {
        kw: `%${keyword.trim()}%`,
      })
    }
    if (status === 0 || status === 1) {
      qb.andWhere('r.status = :status', { status })
    }

    return paginate(qb, page, size)
  }

  /**
   * 查询所有角色（不分页，供「分配角色」下拉框使用）
   * 仅返回启用状态的角色
   */
  async findAllList(): Promise<RoleEntity[]> {
    return this.roleRepo.find({
      where: { status: 1 },
      order: { sort: 'DESC', id: 'ASC' },
    })
  }

  /** 查询单个角色详情（含菜单列表） */
  async findOne(id: number): Promise<RoleEntity> {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['menus'],
    })
    if (!role) throw new NotFoundException('角色不存在')
    return role
  }

  /**
   * 创建角色
   * 流程：1. 校验 code 唯一性 2. 保存主表 3. 写入 role_menus 关联
   */
  async create(params: CreateRoleParams): Promise<RoleEntity> {
    if (!params.code || !params.name) {
      throw new BadRequestException('角色编码和名称不能为空')
    }

    const exists = await this.roleRepo.findOne({ where: { code: params.code } })
    if (exists) throw new BadRequestException('角色编码已存在')

    const role = this.roleRepo.create({
      code: params.code,
      name: params.name,
      status: params.status ?? 1,
      sort: params.sort ?? 0,
      remark: params.remark || '',
    })
    const saved = await this.roleRepo.save(role)

    // 写入菜单关联
    if (params.menuIds && params.menuIds.length > 0) {
      await this.assignMenus(saved.id, params.menuIds)
    }

    return this.findOne(saved.id)
  }

  /**
   * 更新角色
   * code 修改时需重新校验唯一性
   * 超管角色禁止修改 code 和禁用
   */
  async update(id: number, params: UpdateRoleParams): Promise<RoleEntity> {
    const role = await this.roleRepo.findOne({ where: { id } })
    if (!role) throw new NotFoundException('角色不存在')

    // 超管角色保护：禁止修改 code
    if (isSuperAdminRole(role.code) && params.code && params.code !== role.code) {
      throw new BadRequestException('禁止修改超级管理员角色编码')
    }

    // 超管角色保护：禁止禁用
    if (isSuperAdminRole(role.code) && params.status === 0) {
      throw new BadRequestException('禁止禁用超级管理员角色')
    }

    // code 变更时唯一性校验
    if (params.code && params.code !== role.code) {
      const exists = await this.roleRepo.findOne({ where: { code: params.code } })
      if (exists) throw new BadRequestException('角色编码已存在')
      role.code = params.code
    }
    if (params.name !== undefined) role.name = params.name
    if (params.status !== undefined) role.status = params.status
    if (params.sort !== undefined) role.sort = params.sort
    if (params.remark !== undefined) role.remark = params.remark

    await this.roleRepo.save(role)

    // 传了 menuIds 则全量覆盖
    if (params.menuIds !== undefined) {
      await this.assignMenus(id, params.menuIds)
    }

    return this.findOne(id)
  }

  /**
   * 删除角色
   * 业务规则：
   *   - 超管角色禁止删除
   *   - 若仍有用户引用该角色（user_roles 表非空），则拒绝删除
   */
  async remove(id: number): Promise<{ id: number }> {
    const role = await this.roleRepo.findOne({ where: { id } })
    if (!role) throw new NotFoundException('角色不存在')

    // 超管角色禁止删除
    if (isSuperAdminRole(role.code)) {
      throw new BadRequestException('禁止删除超级管理员角色')
    }

    // 检查是否被用户引用
    const usedCount = await this.userRoleRepo.count({ where: { roleId: id } })
    if (usedCount > 0) {
      // ROLE_IN_USE 错误码与 @nodeadmin/shared 对齐
      throw new BadRequestException({
        code: ErrorCode.ROLE_IN_USE,
        message: '角色正在被用户使用，无法删除',
      })
    }

    // 先清菜单关联，再删主表
    await this.roleMenuRepo.delete({ roleId: id })
    await this.roleRepo.delete(id)

    return { id }
  }

  /**
   * 分配菜单：全量覆盖语义
   *
   * 先清空原有 role_menus，再批量插入新关联。
   */
  async assignMenus(
    roleId: number,
    menuIds: number[],
  ): Promise<{ roleId: number; menuIds: number[] }> {
    const role = await this.roleRepo.findOne({ where: { id: roleId } })
    if (!role) throw new NotFoundException('角色不存在')

    // 清空旧关联
    await this.roleMenuRepo.delete({ roleId })

    if (menuIds && menuIds.length > 0) {
      // 校验菜单存在性
      const menus = await this.menuRepo.find({ where: { id: In(menuIds) } })
      if (menus.length !== menuIds.length) {
        throw new BadRequestException('包含不存在的菜单 ID')
      }
      const records = menuIds.map(mid => this.roleMenuRepo.create({ roleId, menuId: mid }))
      await this.roleMenuRepo.save(records)
    }

    return { roleId, menuIds }
  }
}
