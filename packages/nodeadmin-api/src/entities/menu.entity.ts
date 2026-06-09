/**
 * 菜单实体（menus 表）
 *
 * 同一张表承载两种节点：
 *   - 'M'（Menu）：可点击菜单项，对应一个前端路由
 *   - 'B'（Button）：按钮 / 接口级权限码，不渲染菜单，仅作为权限标识
 *
 * 通过 parentId 自引用形成树形结构，根节点 parentId = 0。
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

@Entity('menus')
@Index('idx_parent_id', ['parentId'])
export class MenuEntity {
  /** 菜单主键 ID */
  @PrimaryGeneratedColumn()
  id: number

  /** 父菜单 ID，0 表示根节点 */
  @Column({ name: 'parent_id', type: 'int', default: 0 })
  parentId: number

  /** 菜单名称 / 按钮名称 */
  @Column({ type: 'varchar', length: 64 })
  name: string

  /** 前端路由路径（按钮类型可空） */
  @Column({ type: 'varchar', length: 128, default: '' })
  path: string

  /** 前端组件路径（按钮类型可空） */
  @Column({ type: 'varchar', length: 128, default: '' })
  component: string

  /** 图标标识（如 'lucide:user'，按钮类型可空） */
  @Column({ type: 'varchar', length: 64, default: '' })
  icon: string

  /**
   * 节点类型：
   *   'M' = Menu，渲染到侧边栏
   *   'B' = Button，仅作为权限码
   */
  @Column({ type: 'varchar', length: 2, default: 'M' })
  type: string

  /** 权限码（按钮必填、菜单可选，如 'system:user:add'） */
  @Column({ type: 'varchar', length: 128, default: '' })
  perm: string

  /** 排序权重，值越小越靠前 */
  @Column({ type: 'int', default: 0 })
  sort: number

  /** 是否在侧边栏隐藏：1=隐藏 0=显示（仍参与权限判断） */
  @Column({ type: 'int', default: 0 })
  hidden: number

  /** 状态：1=启用 0=禁用 */
  @Column({ type: 'int', default: 1 })
  status: number

  /** 创建时间（自动维护） */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  /** 更新时间（自动维护） */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
