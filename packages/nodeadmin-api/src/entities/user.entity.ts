/**
 * 用户实体（users 表）
 *
 * RBAC 中"主体"——账号 + 密码 + 基础信息。
 * 通过中间表 user_roles 与 RoleEntity 形成多对多关系。
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
import { RoleEntity } from './role.entity'

@Entity('users')
export class UserEntity {
  /** 用户主键 ID */
  @PrimaryGeneratedColumn()
  id: number

  /** 登录账号，全局唯一 */
  @Column({ type: 'varchar', length: 64, unique: true })
  username: string

  /** 密码 bcrypt 哈希（仅服务端使用，禁止向前端泄露） */
  @Column({ type: 'varchar', length: 128 })
  password: string

  /** 昵称（界面展示） */
  @Column({ type: 'varchar', length: 64, default: '' })
  nickname: string

  /** 邮箱 */
  @Column({ type: 'varchar', length: 128, default: '' })
  email: string

  /** 手机号 */
  @Column({ type: 'varchar', length: 32, default: '' })
  phone: string

  /** 头像 URL（用 text 兼容外链长 URL 与上传相对路径） */
  @Column({ type: 'text' })
  avatar: string

  /** 状态：1=启用 0=禁用 */
  @Column({ type: 'int', default: 1 })
  status: number

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
   * 关联角色（多对多，中间表 user_roles）
   * 注意：JoinTable 仅在多对多的"主控方"声明一次，这里选 User 为主控方
   */
  @ManyToMany(() => RoleEntity)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: RoleEntity[]
}
