/**
 * 启动数据初始化服务（SeedService）
 *
 * 通过 OnModuleInit 钩子在应用启动时执行一次：
 *   - 当 user 表为空（系统首次启动）时，写入超管账号、3 个内置角色、完整菜单 + 按钮权限
 *   - 否则直接跳过，避免每次重启都重复 seed
 *
 * Seed 数据：
 *   - 角色：super_admin（全权限） / admin（业务管理） / user（普通用户）
 *   - 菜单：仪表盘 + 系统管理（用户/角色/菜单/字典）+ 个人中心 + 修改密码
 *   - 按钮：每个业务子菜单下的 增/改/删/分配 按钮权限
 *   - 账号：admin / admin123（bcrypt 哈希）
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from '../../entities/user.entity'
import { RoleEntity } from '../../entities/role.entity'
import { MenuEntity } from '../../entities/menu.entity'
import { UserRoleEntity } from '../../entities/user-role.entity'
import { RoleMenuEntity } from '../../entities/role-menu.entity'
import { hashPassword } from '../../common/utils/hash.util'

/** 菜单 seed 配置：用临时 key 串联父子关系，避免硬编码 ID */
interface MenuSeed {
  /** 临时 key，用于 parentKey 引用 */
  key: string
  /** 父节点 key，null 表示根节点（parentId=0） */
  parentKey: string | null
  name: string
  path?: string
  component?: string
  icon?: string
  type: 'M' | 'B'
  perm?: string
  sort?: number
  hidden?: number
}

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name)

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
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
   * Nest 生命周期钩子：模块装配完成后执行
   * 检测 user 表为空时触发 seed
   */
  async onModuleInit(): Promise<void> {
    const userCount = await this.userRepo.count()
    if (userCount > 0) {
      // 已初始化过，跳过全量 seed
      this.logger.log('用户表已有数据，跳过 Seed 初始化')
      // 增量补齐：检测是否有新版本新增的菜单/权限，自动补插入
      await this.incrementalSeed()
      return
    }

    this.logger.log('检测到首次启动，开始执行 Seed 初始化...')
    await this.seed()
    this.logger.log('Seed 数据初始化完成')
  }

  /**
   * 执行 seed：角色 → 菜单 → 角色菜单关联 → 超管账号 → 用户角色关联
   */
  private async seed(): Promise<void> {
    // 1. 创建 3 个内置角色
    const roles = await this.seedRoles()

    // 2. 创建菜单（含按钮），返回 key→id 映射
    const menuKeyMap = await this.seedMenus()

    // 3. 写入 role_menus 关联
    await this.seedRoleMenus(roles, menuKeyMap)

    // 4. 创建超管账号 admin / admin123
    const admin = await this.seedAdminUser()

    // 5. 关联超管账号到 super_admin 角色
    await this.userRoleRepo.save(
      this.userRoleRepo.create({ userId: admin.id, roleId: roles.super_admin.id }),
    )
  }

  /**
   * 创建 3 个内置角色
   * @returns 角色 code → 实体的映射
   */
  private async seedRoles(): Promise<Record<string, RoleEntity>> {
    const roleConfigs = [
      {
        code: 'super_admin',
        name: '超级管理员',
        status: 1,
        sort: 100,
        remark: '系统超级管理员，拥有所有权限',
      },
      { code: 'admin', name: '管理员', status: 1, sort: 50, remark: '业务管理员' },
      {
        code: 'user',
        name: '普通用户',
        status: 1,
        sort: 10,
        remark: '普通用户，仅可访问仪表盘和个人中心',
      },
    ]
    const map: Record<string, RoleEntity> = {}
    for (const cfg of roleConfigs) {
      const role = await this.roleRepo.save(this.roleRepo.create(cfg))
      map[cfg.code] = role
    }
    return map
  }

  /**
   * 创建完整菜单树（含按钮权限）
   *
   * 实现思路：先用临时 key 描述节点关系，逐个保存并把 ID 写回到 keyMap，
   * 子节点保存时通过 keyMap 解析父 ID。保证父先入库后子才入库。
   *
   * @returns 菜单 key → 菜单 ID 的映射
   */
  private async seedMenus(): Promise<Map<string, number>> {
    /* 菜单配置（顺序很重要：父节点必须在子节点之前） */
    const menuSeeds: MenuSeed[] = [
      // 1. 仪表盘
      {
        key: 'dashboard',
        parentKey: null,
        name: '仪表盘',
        path: '/dashboard',
        component: 'dashboard/index',
        icon: 'ph:gauge',
        type: 'M',
        perm: 'dashboard:view',
        sort: 100,
      },

      // 2. 系统管理（父节点）
      {
        key: 'system',
        parentKey: null,
        name: '系统管理',
        path: '/system',
        icon: 'ph:gear',
        type: 'M',
        sort: 20,
      },

      // 21. 用户管理
      {
        key: 'system_user',
        parentKey: 'system',
        name: '用户管理',
        path: '/system/user',
        component: 'system/user/index',
        icon: 'ph:user',
        type: 'M',
        perm: 'system:user:list',
        sort: 4,
      },
      // 211-214. 用户管理按钮
      {
        key: 'system_user_create',
        parentKey: 'system_user',
        name: '新增用户',
        type: 'B',
        perm: 'system:user:create',
      },
      {
        key: 'system_user_update',
        parentKey: 'system_user',
        name: '编辑用户',
        type: 'B',
        perm: 'system:user:update',
      },
      {
        key: 'system_user_delete',
        parentKey: 'system_user',
        name: '删除用户',
        type: 'B',
        perm: 'system:user:delete',
      },
      {
        key: 'system_user_assignRoles',
        parentKey: 'system_user',
        name: '分配角色',
        type: 'B',
        perm: 'system:user:assignRoles',
      },

      // 22. 角色管理
      {
        key: 'system_role',
        parentKey: 'system',
        name: '角色管理',
        path: '/system/role',
        component: 'system/role/index',
        icon: 'ph:users-three',
        type: 'M',
        perm: 'system:role:list',
        sort: 3,
      },
      {
        key: 'system_role_create',
        parentKey: 'system_role',
        name: '新增角色',
        type: 'B',
        perm: 'system:role:create',
      },
      {
        key: 'system_role_update',
        parentKey: 'system_role',
        name: '编辑角色',
        type: 'B',
        perm: 'system:role:update',
      },
      {
        key: 'system_role_delete',
        parentKey: 'system_role',
        name: '删除角色',
        type: 'B',
        perm: 'system:role:delete',
      },
      {
        key: 'system_role_assignMenus',
        parentKey: 'system_role',
        name: '分配菜单',
        type: 'B',
        perm: 'system:role:assignMenus',
      },

      // 23. 菜单管理
      {
        key: 'system_menu',
        parentKey: 'system',
        name: '菜单管理',
        path: '/system/menu',
        component: 'system/menu/index',
        icon: 'ph:tree-structure',
        type: 'M',
        perm: 'system:menu:list',
        sort: 2,
      },
      {
        key: 'system_menu_create',
        parentKey: 'system_menu',
        name: '新增菜单',
        type: 'B',
        perm: 'system:menu:create',
      },
      {
        key: 'system_menu_update',
        parentKey: 'system_menu',
        name: '编辑菜单',
        type: 'B',
        perm: 'system:menu:update',
      },
      {
        key: 'system_menu_delete',
        parentKey: 'system_menu',
        name: '删除菜单',
        type: 'B',
        perm: 'system:menu:delete',
      },

      // 24. 字典管理
      {
        key: 'system_dict',
        parentKey: 'system',
        name: '字典管理',
        path: '/system/dict',
        component: 'system/dict/index',
        icon: 'ph:book-open',
        type: 'M',
        perm: 'system:dict:list',
        sort: 1,
      },
      {
        key: 'system_dict_create',
        parentKey: 'system_dict',
        name: '新增字典',
        type: 'B',
        perm: 'system:dict:create',
      },
      {
        key: 'system_dict_update',
        parentKey: 'system_dict',
        name: '编辑字典',
        type: 'B',
        perm: 'system:dict:update',
      },
      {
        key: 'system_dict_delete',
        parentKey: 'system_dict',
        name: '删除字典',
        type: 'B',
        perm: 'system:dict:delete',
      },

      // 25. 站点设置
      {
        key: 'system_site',
        parentKey: 'system',
        name: '站点设置',
        path: '/system/site',
        component: 'system/site/index',
        icon: 'ph:sliders-horizontal',
        type: 'M',
        perm: 'system:site:list',
        sort: 0,
      },
      {
        key: 'system_site_update',
        parentKey: 'system_site',
        name: '更新设置',
        type: 'B',
        perm: 'system:site:update',
      },

      // 3. 个人中心（hidden=1：通过 header 入口跳转，不在 sidebar 显示）
      {
        key: 'profile_index',
        parentKey: null,
        name: '个人中心',
        path: '/profile/index',
        component: 'profile/index',
        icon: 'ph:identification-card',
        type: 'M',
        perm: 'profile:view',
        sort: 5,
        hidden: 1,
      },

      // 4. 修改密码（hidden=1）
      {
        key: 'profile_password',
        parentKey: null,
        name: '修改密码',
        path: '/profile/password',
        component: 'profile/password',
        icon: 'ph:lock-key',
        type: 'M',
        perm: 'profile:password',
        sort: 4,
        hidden: 1,
      },
    ]

    const keyMap = new Map<string, number>()
    // 顺序保存：父节点先入库后才能查到 parentId
    for (const seed of menuSeeds) {
      const parentId = seed.parentKey ? keyMap.get(seed.parentKey) || 0 : 0
      const menu = this.menuRepo.create({
        parentId,
        name: seed.name,
        path: seed.path || '',
        component: seed.component || '',
        icon: seed.icon || '',
        type: seed.type,
        perm: seed.perm || '',
        sort: seed.sort ?? 0,
        hidden: seed.hidden ?? 0,
        status: 1,
      })
      const saved = await this.menuRepo.save(menu)
      keyMap.set(seed.key, saved.id)
    }
    return keyMap
  }

  /**
   * 写入 role_menus 关联
   *
   * 授权策略：
   *   - super_admin：所有菜单 + 所有按钮
   *   - admin：仪表盘 + 用户/角色/字典（不含菜单管理）+ 个人中心 + 修改密码 + 对应按钮
   *   - user：仪表盘 + 个人中心 + 修改密码
   */
  private async seedRoleMenus(
    roles: Record<string, RoleEntity>,
    keyMap: Map<string, number>,
  ): Promise<void> {
    // super_admin：所有菜单
    const allMenuIds = Array.from(keyMap.values())
    await this.bulkInsertRoleMenus(roles.super_admin.id, allMenuIds)

    // admin：排除「菜单管理」相关
    const adminMenuKeys = [
      'dashboard',
      'system',
      'system_user',
      'system_user_create',
      'system_user_update',
      'system_user_delete',
      'system_user_assignRoles',
      'system_role',
      'system_role_create',
      'system_role_update',
      'system_role_delete',
      'system_role_assignMenus',
      'system_dict',
      'system_dict_create',
      'system_dict_update',
      'system_dict_delete',
      'system_site',
      'system_site_update',
      'profile_index',
      'profile_password',
    ]
    const adminMenuIds = adminMenuKeys
      .map(k => keyMap.get(k))
      .filter((id): id is number => id !== undefined)
    await this.bulkInsertRoleMenus(roles.admin.id, adminMenuIds)

    // user：仅基础访问
    const userMenuKeys = ['dashboard', 'profile_index', 'profile_password']
    const userMenuIds = userMenuKeys
      .map(k => keyMap.get(k))
      .filter((id): id is number => id !== undefined)
    await this.bulkInsertRoleMenus(roles.user.id, userMenuIds)
  }

  /** 批量插入角色-菜单关联 */
  private async bulkInsertRoleMenus(roleId: number, menuIds: number[]): Promise<void> {
    if (menuIds.length === 0) return
    const records = menuIds.map(menuId => this.roleMenuRepo.create({ roleId, menuId }))
    await this.roleMenuRepo.save(records)
  }

  /**
   * 增量 seed：检测并补齐新版本新增的菜单和权限
   *
   * 场景：已有数据库升级到新版本后，不需要清库，重启 API 自动补齐。
   * 逻辑：按 perm 字段去重，不存在才插入；然后给 super_admin 和 admin 补授权。
   */
  private async incrementalSeed(): Promise<void> {
    // 查找「系统管理」父菜单
    const systemParent = await this.menuRepo.findOne({ where: { name: '系统管理', parentId: 0 } })
    if (!systemParent) {
      this.logger.warn('未找到「系统管理」父菜单，跳过增量 seed')
      return
    }

    // 给 super_admin 和 admin 补授权的辅助方法
    const superAdminRole = await this.roleRepo.findOne({ where: { code: 'super_admin' } })
    const adminRole = await this.roleRepo.findOne({ where: { code: 'admin' } })

    // ============ 站点设置 ============
    const siteMenuExists = await this.menuRepo.findOne({ where: { perm: 'system:site:list' } })
    if (!siteMenuExists) {
      this.logger.log('检测到缺少「站点设置」菜单，开始增量补齐...')

      const siteMenu = this.menuRepo.create({
        parentId: systemParent.id,
        name: '站点设置',
        path: '/system/site',
        component: 'system/site/index',
        icon: 'ph:sliders-horizontal',
        type: 'M',
        perm: 'system:site:list',
        sort: 0,
        hidden: 0,
        status: 1,
      })
      const savedSiteMenu = await this.menuRepo.save(siteMenu)

      const siteUpdateBtn = this.menuRepo.create({
        parentId: savedSiteMenu.id,
        name: '更新设置',
        path: '',
        component: '',
        icon: '',
        type: 'B',
        perm: 'system:site:update',
        sort: 0,
        hidden: 0,
        status: 1,
      })
      await this.menuRepo.save(siteUpdateBtn)

      if (superAdminRole) {
        await this.bulkInsertRoleMenus(superAdminRole.id, [savedSiteMenu.id, siteUpdateBtn.id])
      }
      if (adminRole) {
        await this.bulkInsertRoleMenus(adminRole.id, [savedSiteMenu.id, siteUpdateBtn.id])
      }

      this.logger.log('「站点设置」菜单和权限增量补齐完成')
    }

    // ============ 定时任务 ============
    const cronMenuExists = await this.menuRepo.findOne({ where: { perm: 'system:cron:list' } })
    if (!cronMenuExists) {
      this.logger.log('检测到缺少「定时任务」菜单，开始增量补齐...')

      // 插入「定时任务」菜单
      const cronMenu = this.menuRepo.create({
        parentId: systemParent.id,
        name: '定时任务',
        path: '/system/cron',
        component: 'system/cron/index',
        icon: 'ph:clock-countdown',
        type: 'M',
        perm: 'system:cron:list',
        sort: -1,
        hidden: 0,
        status: 1,
      })
      const savedCronMenu = await this.menuRepo.save(cronMenu)

      // 插入按钮权限
      const cronButtons = [
        { name: '新增任务', perm: 'system:cron:create' },
        { name: '编辑任务', perm: 'system:cron:update' },
        { name: '删除任务', perm: 'system:cron:delete' },
        { name: '手动执行', perm: 'system:cron:trigger' },
      ]
      const cronMenuIds = [savedCronMenu.id]
      for (const btn of cronButtons) {
        const btnEntity = this.menuRepo.create({
          parentId: savedCronMenu.id,
          name: btn.name,
          path: '',
          component: '',
          icon: '',
          type: 'B',
          perm: btn.perm,
          sort: 0,
          hidden: 0,
          status: 1,
        })
        const savedBtn = await this.menuRepo.save(btnEntity)
        cronMenuIds.push(savedBtn.id)
      }

      // 给 super_admin 和 admin 补授权
      if (superAdminRole) {
        await this.bulkInsertRoleMenus(superAdminRole.id, cronMenuIds)
      }
      if (adminRole) {
        await this.bulkInsertRoleMenus(adminRole.id, cronMenuIds)
      }

      this.logger.log('「定时任务」菜单和权限增量补齐完成')
    }
  }

  /**
   * 创建超管账号：admin / admin123（bcrypt 哈希）
   */
  private async seedAdminUser(): Promise<UserEntity> {
    const hashed = await hashPassword('admin123')
    const user = this.userRepo.create({
      username: 'admin',
      password: hashed,
      nickname: '超级管理员',
      email: '',
      phone: '',
      avatar: '',
      status: 1,
      remark: '系统内置超级管理员账号',
    })
    return this.userRepo.save(user)
  }
}
