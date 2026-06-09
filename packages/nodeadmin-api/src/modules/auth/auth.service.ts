/**
 * 认证服务（AuthService）
 *
 * 提供登录、登出、获取当前用户信息、修改密码、检查系统初始化状态等核心逻辑。
 * 与 zstarbox 单租户单管理员模式不同，本服务基于 RBAC 三表（user/role/menu）
 * 实现真正的多用户多角色登录。
 */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from '../../entities/user.entity'
import { MenuEntity } from '../../entities/menu.entity'
import { hashPassword, comparePassword } from '../../common/utils/hash.util'
import { parseAccessExpiresInSeconds } from '../../common/utils/token.util'

/**
 * 菜单树节点（仅包含本服务需要的字段；与 @nodeadmin/shared 的 MenuTreeNode 结构一致）
 */
interface MenuTreeNode {
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
  children: MenuTreeNode[]
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(MenuEntity)
    private readonly menuRepo: Repository<MenuEntity>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 检查系统是否已初始化
   *
   * 业务规则：user 表中存在任意记录即视为已初始化。
   * @returns `{ initialized: boolean }`
   */
  async getInitStatus(): Promise<{ initialized: boolean }> {
    // count 比 find 更轻量，仅查总数
    const count = await this.userRepo.count()
    return { initialized: count > 0 }
  }

  /**
   * 登录：校验账号密码并签发 JWT
   *
   * @param username 登录账号
   * @param password 明文密码
   * @returns 登录响应：accessToken / 过期时长 / 用户基础信息 / 菜单树 / 权限码
   */
  async login(username: string, password: string) {
    if (!username || !password) {
      throw new BadRequestException('用户名或密码不能为空')
    }

    // 一次性加载用户 + 角色 + 角色下的菜单（leftJoinAndSelect 避免 N+1）
    const user = await this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .leftJoinAndSelect('r.menus', 'm')
      .where('u.username = :username', { username })
      .getOne()

    if (!user) throw new UnauthorizedException('用户名或密码错误')

    // 比对 bcrypt 密码哈希
    const ok = await comparePassword(password, user.password)
    if (!ok) throw new UnauthorizedException('用户名或密码错误')

    // 禁用账号禁止登录
    if (user.status !== 1) throw new ForbiddenException('账号已被禁用')

    // 汇总该用户所有角色下的菜单（去重）
    const allMenus = this.collectUserMenus(user)
    // 仅菜单类型（type='M'）构成菜单树；按钮（'B'）只贡献 perm
    const menuTree = this.buildMenuTree(allMenus.filter(m => m.type === 'M'))
    // 所有菜单 + 按钮的 perm 都纳入权限码集合
    const perms = this.extractPerms(allMenus)

    // 签发 JWT：sub=用户ID，并把 perms 也写入 payload，供 PermissGuard 使用
    const expiresIn = parseAccessExpiresInSeconds(604800)
    const accessToken = this.jwtService.sign(
      { sub: user.id, username: user.username, perms },
      { secret: process.env.JWT_ACCESS_SECRET!, expiresIn },
    )

    return {
      accessToken,
      expiresIn,
      user: this.toUserInfo(user),
      menus: menuTree,
      perms,
    }
  }

  /**
   * 登出：服务端无状态 JWT 模式，无需做任何事；Cookie 由 Controller 清除
   */
  async logout(): Promise<{ message: string }> {
    // noop：Token 自然过期前仍有效，前端清 Cookie 即可
    return { message: '已登出' }
  }

  /**
   * 获取当前用户信息 + 最新菜单 / 权限
   *
   * 每次返回最新数据，确保角色 / 菜单变更后用户无需重新登录即可生效（刷新页面即可）。
   * @param userId 用户主键 ID（由 @CurrentUser('id') 注入）
   */
  async getProfile(userId: number) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .leftJoinAndSelect('r.menus', 'm')
      .where('u.id = :id', { id: userId })
      .getOne()

    if (!user) throw new UnauthorizedException('用户不存在或已删除')

    const allMenus = this.collectUserMenus(user)
    const menuTree = this.buildMenuTree(allMenus.filter(m => m.type === 'M'))
    const perms = this.extractPerms(allMenus)

    return {
      user: this.toUserInfo(user),
      menus: menuTree,
      perms,
    }
  }

  /**
   * 修改密码：先校验旧密码，再 bcrypt 写入新密码
   *
   * @param userId      当前登录用户 ID
   * @param oldPassword 旧密码（明文）
   * @param newPassword 新密码（明文）
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    // 仅校验非空：业务暂不强制复杂度，避免阻塞首批用户使用
    if (!newPassword || !newPassword.trim()) {
      throw new BadRequestException('新密码不能为空')
    }

    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('用户不存在或已删除')

    // 校验旧密码
    const ok = await comparePassword(oldPassword, user.password)
    if (!ok) throw new UnauthorizedException('旧密码错误')

    // 写入新哈希
    user.password = await hashPassword(newPassword)
    await this.userRepo.save(user)

    return { message: '密码修改成功' }
  }

  /**
   * 更新个人资料（昵称、邮箱、手机号、头像）
   *
   * 所有字段均为可选，传了就更新；不传保持原值不变。
   * 更新后返回最新的 UserInfo（不包含 password 等敏感字段）。
   *
   * @param userId 当前登录用户 ID
   * @param dto    待更新的字段对象
   * @returns 更新后的用户基础信息
   */
  async updateProfile(
    userId: number,
    dto: { nickname?: string; email?: string; phone?: string; avatar?: string },
  ) {
    // 加载用户及其角色关系，确保 toUserInfo 能正确提取 roles
    const user = await this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .where('u.id = :id', { id: userId })
      .getOne()
    if (!user) throw new UnauthorizedException('用户不存在或已删除')

    // 仅更新传过来的字段，避免覆盖未修改项
    if (dto.nickname !== undefined) user.nickname = dto.nickname
    if (dto.email !== undefined) user.email = dto.email
    if (dto.phone !== undefined) user.phone = dto.phone
    if (dto.avatar !== undefined) user.avatar = dto.avatar

    await this.userRepo.save(user)

    return this.toUserInfo(user)
  }

  // ============ 私有辅助方法 ============

  /**
   * 把 UserEntity → UserInfo（剥离密码等敏感字段）
   */
  private toUserInfo(user: UserEntity) {
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      email: user.email,
      phone: user.phone,
      roles: (user.roles || []).map(r => r.name),
    }
  }

  /**
   * 收集用户所有角色下的菜单并按 id 去重
   *
   * 同一菜单可能被多个角色拥有，去重以避免菜单树 / perms 出现重复条目。
   */
  private collectUserMenus(user: UserEntity): MenuEntity[] {
    const map = new Map<number, MenuEntity>()
    for (const role of user.roles || []) {
      // 仅取启用状态的菜单
      for (const menu of role.menus || []) {
        if (menu.status === 1 && !map.has(menu.id)) {
          map.set(menu.id, menu)
        }
      }
    }
    return Array.from(map.values())
  }

  /**
   * 将扁平菜单数组转为嵌套菜单树
   *
   * 算法：先把每个菜单挂到 id→node 的 map 中，再遍历挂载到对应父节点的 children；
   * parentId=0 视为根节点。children 按 sort DESC 排序。
   */
  private buildMenuTree(menus: MenuEntity[]): MenuTreeNode[] {
    const map = new Map<number, MenuTreeNode>()
    // 第一遍：构造节点
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
        children: [],
      })
    })

    const roots: MenuTreeNode[] = []
    // 第二遍：挂载父子关系
    map.forEach(node => {
      if (node.parentId === 0 || !map.has(node.parentId)) {
        // 父节点不在当前权限菜单集合内时，提升为根节点
        roots.push(node)
      } else {
        map.get(node.parentId)!.children.push(node)
      }
    })

    // 递归按 sort DESC 排序（sort 越大越靠前，与 spec 一致）
    const sortTree = (nodes: MenuTreeNode[]) => {
      nodes.sort((a, b) => b.sort - a.sort)
      nodes.forEach(n => sortTree(n.children))
    }
    sortTree(roots)
    return roots
  }

  /**
   * 从菜单 / 按钮中提取 perm 字段（去重，过滤空字符串）
   */
  private extractPerms(menus: MenuEntity[]): string[] {
    const set = new Set<string>()
    menus.forEach(m => {
      if (m.perm && m.perm.trim()) set.add(m.perm.trim())
    })
    return Array.from(set)
  }
}
