/**
 * 菜单服务（MenuService）
 *
 * 提供菜单的树形查询、CRUD、buildTree 工具方法。
 * 业务规则：
 *   - 删除菜单前检查是否有子菜单或关联角色，有则禁止删除
 *   - 「按钮」类型（type='B'）必须挂靠在「菜单」类型（type='M'）下
 */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MenuEntity } from '../../entities/menu.entity'
import { RoleMenuEntity } from '../../entities/role-menu.entity'

/** 菜单树节点接口 */
export interface MenuTreeNode {
  id: number
  parentId: number
  name: string
  path: string
  component: string
  icon: string
  type: string
  perm: string
  sort: number
  hidden: number
  status: number
  createdAt: Date
  updatedAt: Date
  children: MenuTreeNode[]
}

/** 创建菜单参数 */
export interface CreateMenuParams {
  parentId?: number
  name: string
  path?: string
  component?: string
  icon?: string
  type?: string
  perm?: string
  sort?: number
  hidden?: number
  status?: number
}

/** 更新菜单参数 */
export interface UpdateMenuParams {
  parentId?: number
  name?: string
  path?: string
  component?: string
  icon?: string
  type?: string
  perm?: string
  sort?: number
  hidden?: number
  status?: number
}

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuEntity)
    private readonly menuRepo: Repository<MenuEntity>,
    @InjectRepository(RoleMenuEntity)
    private readonly roleMenuRepo: Repository<RoleMenuEntity>,
  ) {}

  /**
   * 获取全量菜单树
   *
   * 注意：此接口返回所有菜单不过滤权限（管理员分配菜单用）；
   * 前端动态菜单由 auth/profile 接口按当前用户角色过滤。
   */
  async getTree(): Promise<MenuTreeNode[]> {
    const all = await this.menuRepo.find({
      order: { sort: 'DESC', id: 'ASC' },
    })
    return this.buildTree(all)
  }

  /**
   * 获取平铺列表（支持按 status 过滤）
   * 用于常规列表展示场景
   */
  async findAll(status?: number): Promise<MenuEntity[]> {
    const where: any = {}
    if (status === 0 || status === 1) where.status = status
    return this.menuRepo.find({
      where,
      order: { sort: 'DESC', id: 'ASC' },
    })
  }

  /** 查询单个菜单 */
  async findOne(id: number): Promise<MenuEntity> {
    const menu = await this.menuRepo.findOne({ where: { id } })
    if (!menu) throw new NotFoundException('菜单不存在')
    return menu
  }

  /** 创建菜单 */
  async create(params: CreateMenuParams): Promise<MenuEntity> {
    if (!params.name) {
      throw new BadRequestException('菜单名称不能为空')
    }

    const menu = this.menuRepo.create({
      parentId: params.parentId ?? 0,
      name: params.name,
      path: params.path || '',
      component: params.component || '',
      icon: params.icon || '',
      type: params.type || 'M',
      perm: params.perm || '',
      sort: params.sort ?? 0,
      hidden: params.hidden ?? 0,
      status: params.status ?? 1,
    })
    return this.menuRepo.save(menu)
  }

  /** 更新菜单 */
  async update(id: number, params: UpdateMenuParams): Promise<MenuEntity> {
    const menu = await this.menuRepo.findOne({ where: { id } })
    if (!menu) throw new NotFoundException('菜单不存在')

    if (params.parentId !== undefined) menu.parentId = params.parentId
    if (params.name !== undefined) menu.name = params.name
    if (params.path !== undefined) menu.path = params.path
    if (params.component !== undefined) menu.component = params.component
    if (params.icon !== undefined) menu.icon = params.icon
    if (params.type !== undefined) menu.type = params.type
    if (params.perm !== undefined) menu.perm = params.perm
    if (params.sort !== undefined) menu.sort = params.sort
    if (params.hidden !== undefined) menu.hidden = params.hidden
    if (params.status !== undefined) menu.status = params.status

    await this.menuRepo.save(menu)
    return this.findOne(id)
  }

  /**
   * 删除菜单
   *
   * 业务规则：
   *   1. 有子菜单的父节点禁止删除（需先删子）
   *   2. 有角色关联的菜单禁止删除（需先解除授权）
   */
  async remove(id: number): Promise<{ id: number }> {
    const menu = await this.menuRepo.findOne({ where: { id } })
    if (!menu) throw new NotFoundException('菜单不存在')

    // 检查子菜单
    const childCount = await this.menuRepo.count({ where: { parentId: id } })
    if (childCount > 0) {
      throw new BadRequestException('存在子菜单，请先删除子菜单')
    }

    // 检查角色关联
    const roleCount = await this.roleMenuRepo.count({ where: { menuId: id } })
    if (roleCount > 0) {
      throw new BadRequestException('菜单已被角色关联，请先解除授权')
    }

    await this.menuRepo.delete(id)
    return { id }
  }

  // ============ 公共工具方法 ============

  /**
   * 将扁平菜单列表构建为嵌套树
   *
   * 算法：id→node map + parentId 挂载。parentId=0 或父节点不存在时视为根。
   */
  buildTree(menus: MenuEntity[]): MenuTreeNode[] {
    const map = new Map<number, MenuTreeNode>()
    menus.forEach(m => {
      map.set(m.id, {
        id: m.id,
        parentId: m.parentId,
        name: m.name,
        path: m.path,
        component: m.component,
        icon: m.icon,
        type: m.type,
        perm: m.perm,
        sort: m.sort,
        hidden: m.hidden,
        status: m.status,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        children: [],
      })
    })

    const roots: MenuTreeNode[] = []
    map.forEach(node => {
      if (node.parentId === 0 || !map.has(node.parentId)) {
        roots.push(node)
      } else {
        map.get(node.parentId)!.children.push(node)
      }
    })

    // 递归排序 sort DESC
    const sortTree = (nodes: MenuTreeNode[]) => {
      nodes.sort((a, b) => b.sort - a.sort)
      nodes.forEach(n => sortTree(n.children))
    }
    sortTree(roots)
    return roots
  }
}
