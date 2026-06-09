/**
 * 角色实体（roles 表）
 *
 * RBAC 中"角色"——用户与权限之间的桥梁。
 * 通过中间表 role_menus 与 MenuEntity 形成多对多关系。
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm'
import { MenuEntity } from './menu.entity'

@Entity('roles')
export class RoleEntity {
  /** 角色主键 ID */
  @PrimaryGeneratedColumn()
  id: number

  /** 角色编码（程序内判断用，全局唯一，如 'admin' / 'common'） */
  @Column({ type: 'varchar', length: 64, unique: true })
  code: string

  /** 角色名称（界面展示文案） */
  @Column({ type: 'varchar', length: 64 })
  name: string

  /** 状态：1=启用 0=禁用 */
  @Column({ type: 'int', default: 1 })
  status: number

  /** 排序权重，值越小越靠前 */
  @Column({ type: 'int', default: 0 })
  sort: number

  /** 备注 */
  @Column({ type: 'varchar', length: 255, default: '' })
  remark: string

  /** 创建时间（自动维护） */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  /** 更新时间（自动维护） */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  /**
   * 关联菜单（多对多，中间表 role_menus）
   * 这里 Role 为主控方
   */
  @ManyToMany(() => MenuEntity)
  @JoinTable({
    name: 'role_menus',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'menu_id', referencedColumnName: 'id' },
  })
  menus: MenuEntity[]
}
