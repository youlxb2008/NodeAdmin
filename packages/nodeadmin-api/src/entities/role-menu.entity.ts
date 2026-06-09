/**
 * 角色-菜单关联实体（role_menus 中间表）
 *
 * 与 RoleEntity.@JoinTable 配置一一对应；
 * 单独建实体便于在不加载 Role 关联的情况下做轻量 SQL（如重新授权时先清后插）。
 */
import { Entity, PrimaryColumn } from 'typeorm'

@Entity('role_menus')
export class RoleMenuEntity {
  /** 角色 ID（联合主键） */
  @PrimaryColumn({ name: 'role_id', type: 'int' })
  roleId: number

  /** 菜单 ID（联合主键） */
  @PrimaryColumn({ name: 'menu_id', type: 'int' })
  menuId: number
}
