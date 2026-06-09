/**
 * 字典实体（dicts 表）
 *
 * 单张表承载所有字典项：同一 type 下的多条记录构成一组下拉选项。
 * 例如 type='user_gender' 下含 (label='男', value='1') / (label='女', value='2')。
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

@Entity('dicts')
@Index('idx_type', ['type'])
export class DictEntity {
  /** 字典项主键 ID */
  @PrimaryGeneratedColumn()
  id: number

  /** 字典类型编码（同组共享，如 'user_gender'） */
  @Column({ type: 'varchar', length: 64 })
  type: string

  /** 显示文本（如「男」） */
  @Column({ type: 'varchar', length: 128 })
  label: string

  /** 实际取值（字符串存储，兼容数字 / 编码两类用法） */
  @Column({ type: 'varchar', length: 128 })
  value: string

  /** 排序权重，值越小越靠前 */
  @Column({ type: 'int', default: 0 })
  sort: number

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
}
