/**
 * 用户-角色关联实体（user_roles 中间表）
 *
 * 与 UserEntity.@JoinTable 配置一一对应；
 * 单独建实体便于在不加载 User 关联的情况下做轻量 SQL（如批量删除关联）。
 */
import { Entity, PrimaryColumn } from 'typeorm'

@Entity('user_roles')
export class UserRoleEntity {
  /** 用户 ID（联合主键） */
  @PrimaryColumn({ name: 'user_id', type: 'int' })
  userId: number

  /** 角色 ID（联合主键） */
  @PrimaryColumn({ name: 'role_id', type: 'int' })
  roleId: number
}
