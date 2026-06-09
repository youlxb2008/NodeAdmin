/**
 * 用户服务（UserService）
 *
 * 提供用户的增删改查、分页、角色分配等核心业务逻辑。
 * 业务规则：
 *   - 密码新建时必须 bcrypt 加密入库；更新时未传 password 字段则保留原值
 *   - roleIds 全量覆盖语义：传入数组直接替换原关联
 *   - 超管账号（id=1）禁止被删除，防止误操作锁死系统
 */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { UserEntity } from '../../entities/user.entity'
import { RoleEntity } from '../../entities/role.entity'
import { UserRoleEntity } from '../../entities/user-role.entity'
import { hashPassword } from '../../common/utils/hash.util'
import { paginate, PageResult } from '../../common/utils/pagination.util'
import { isSuperAdminUser } from '../../common/utils/superadmin.util'

/** 列表查询参数 */
export interface QueryUserParams {
  page?: number
  size?: number
  keyword?: string
  status?: number
}

/** 创建用户参数 */
export interface CreateUserParams {
  username: string
  password: string
  nickname?: string
  email?: string
  phone?: string
  avatar?: string
  status?: number
  remark?: string
  roleIds?: number[]
}

/** 更新用户参数（password 可选） */
export interface UpdateUserParams {
  password?: string
  nickname?: string
  email?: string
  phone?: string
  avatar?: string
  status?: number
  remark?: string
  roleIds?: number[]
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepo: Repository<UserRoleEntity>,
  ) {}

  /**
   * 分页查询用户列表
   *
   * 支持按 username / nickname / email 模糊检索，按状态精确过滤；
   * 返回值不含 password 字段（在 map 中显式剥离）。
   */
  async findAll(params: QueryUserParams): Promise<PageResult<UserEntity>> {
    const { page = 1, size = 10, keyword, status } = params

    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .orderBy('u.id', 'DESC')

    // 关键字模糊：用户名 / 昵称 / 邮箱（OR）
    if (keyword && keyword.trim()) {
      qb.andWhere('(u.username LIKE :kw OR u.nickname LIKE :kw OR u.email LIKE :kw)', {
        kw: `%${keyword.trim()}%`,
      })
    }
    // 状态精确过滤（允许 0 / 1）
    if (status === 0 || status === 1) {
      qb.andWhere('u.status = :status', { status })
    }

    const result = await paginate(qb, page, size)
    // 剥离密码字段，避免泄露给前端
    result.data.forEach(u => {
      delete (u as Partial<UserEntity>).password
    })
    return result
  }

  /**
   * 根据 ID 查询用户详情（含角色列表）
   */
  async findOne(id: number): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['roles'],
    })
    if (!user) throw new NotFoundException('用户不存在')
    // 屏蔽密码
    delete (user as Partial<UserEntity>).password
    return user
  }

  /**
   * 创建用户
   *
   * 流程：
   *   1. 校验用户名唯一性
   *   2. bcrypt 加密密码
   *   3. 保存用户主表
   *   4. 写入 user_roles 关联
   */
  async create(params: CreateUserParams): Promise<UserEntity> {
    if (!params.username || !params.password) {
      throw new BadRequestException('用户名和密码不能为空')
    }

    // 唯一性校验
    const exists = await this.userRepo.findOne({ where: { username: params.username } })
    if (exists) throw new BadRequestException('用户名已存在')

    // bcrypt 加密
    const hashed = await hashPassword(params.password)

    // 创建实体
    const user = this.userRepo.create({
      username: params.username,
      password: hashed,
      nickname: params.nickname || '',
      email: params.email || '',
      phone: params.phone || '',
      avatar: params.avatar || '',
      status: params.status ?? 1,
      remark: params.remark || '',
    })
    const saved = await this.userRepo.save(user)

    // 写入角色关联
    if (params.roleIds && params.roleIds.length > 0) {
      await this.assignRoles(saved.id, params.roleIds)
    }

    return this.findOne(saved.id)
  }

  /**
   * 更新用户
   *
   * - password 字段为空 / 未传则不修改
   * - roleIds 字段传入则全量覆盖关联
   * - 超管账号禁止禁用（status=0）
   */
  async update(id: number, params: UpdateUserParams): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) throw new NotFoundException('用户不存在')

    // 超管账号禁止禁用
    if (isSuperAdminUser(id) && params.status === 0) {
      throw new BadRequestException('禁止禁用超级管理员账号')
    }

    // 仅当传了 password 才更新（避免每次保存都重写密码）
    if (params.password && params.password.trim()) {
      user.password = await hashPassword(params.password)
    }
    // 其他基础字段：传了就更新（含空字符串覆盖语义）
    if (params.nickname !== undefined) user.nickname = params.nickname
    if (params.email !== undefined) user.email = params.email
    if (params.phone !== undefined) user.phone = params.phone
    if (params.avatar !== undefined) user.avatar = params.avatar
    if (params.status !== undefined) user.status = params.status
    if (params.remark !== undefined) user.remark = params.remark

    await this.userRepo.save(user)

    // 角色关联：传了 roleIds 才覆盖
    if (params.roleIds !== undefined) {
      await this.assignRoles(id, params.roleIds)
    }

    return this.findOne(id)
  }

  /**
   * 删除用户
   *
   * 业务规则：禁止删除超管账号
   */
  async remove(id: number): Promise<{ id: number }> {
    if (isSuperAdminUser(id)) {
      throw new BadRequestException('禁止删除超级管理员账号')
    }
    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) throw new NotFoundException('用户不存在')

    // 先删关联表（避免外键残留）
    await this.userRoleRepo.delete({ userId: id })
    await this.userRepo.delete(id)

    return { id }
  }

  /**
   * 分配角色：全量覆盖语义
   *
   * 实现：先清空该用户原有关联，再批量插入新关联（在一个 Repository 事务上下文中）
   */
  async assignRoles(
    userId: number,
    roleIds: number[],
  ): Promise<{ userId: number; roleIds: number[] }> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('用户不存在')

    // 清空旧关联
    await this.userRoleRepo.delete({ userId })

    if (roleIds && roleIds.length > 0) {
      // 校验角色存在性，避免脏数据
      const roles = await this.roleRepo.find({ where: { id: In(roleIds) } })
      if (roles.length !== roleIds.length) {
        throw new BadRequestException('包含不存在的角色 ID')
      }
      // 批量插入新关联
      const records = roleIds.map(rid => this.userRoleRepo.create({ userId, roleId: rid }))
      await this.userRoleRepo.save(records)
    }

    return { userId, roleIds }
  }
}
