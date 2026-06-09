/**
 * 配置实体（对应 options 表）
 *
 * 使用 key-value 模式存储站点配置。
 * value 字段存 JSON 字符串，支持复杂配置结构。
 * 参考 zstarbox 的 OptionEntity 设计。
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('options')
export class OptionEntity {
  /** 主键 ID */
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number

  /** 配置键，全局唯一（如 site_config） */
  @Column({ type: 'varchar', length: 64, unique: true })
  key: string

  /** 配置值，JSON 字符串 */
  @Column({ type: 'text' })
  value: string

  /** 扩展字段（预留） */
  @Column({ type: 'varchar', length: 4096, default: '' })
  extend: string
}
