/**
 * 仪表盘服务（DashboardService）
 *
 * 汇总系统总览数据：用户 / 角色 / 菜单 / 字典数量。
 * 后续可扩展更多业务指标（如最近 7 天注册、活跃用户等）。
 */
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from '../../entities/user.entity'
import { RoleEntity } from '../../entities/role.entity'
import { MenuEntity } from '../../entities/menu.entity'
import { DictEntity } from '../../entities/dict.entity'

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(MenuEntity)
    private readonly menuRepo: Repository<MenuEntity>,
    @InjectRepository(DictEntity)
    private readonly dictRepo: Repository<DictEntity>,
  ) {}

  /**
   * 获取仪表盘统计数据
   *
   * @returns 各类资源的总数
   */
  async getStats(): Promise<{
    userCount: number
    roleCount: number
    menuCount: number
    dictCount: number
  }> {
    // 并行执行 4 个 count 查询，最大化性能
    const [userCount, roleCount, menuCount, dictCount] = await Promise.all([
      this.userRepo.count(),
      this.roleRepo.count(),
      this.menuRepo.count(),
      this.dictRepo.count(),
    ])
    return { userCount, roleCount, menuCount, dictCount }
  }
}
