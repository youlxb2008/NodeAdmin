/**
 * 数据库初始化脚本（init-db）
 *
 * 用途：在不启动整个 NestJS 应用的情况下，仅通过 TypeORM synchronize 创建 / 同步表结构。
 * 常用场景：
 *   - 新部署的环境下手工建表
 *   - CI / CD 流水线中作为预热步骤
 *
 * 使用方法：
 *   pnpm ts-node scripts/init-db.ts
 *
 * 注意：seed 数据（角色 / 菜单 / 超管账号）由 SeedService 在应用启动时自动写入，
 * 本脚本仅负责表结构同步。需要先在系统环境中设置好 DB_* 环境变量（或通过 dotenv 加载）。
 */
import { DataSource } from 'typeorm'
import { UserEntity } from '../src/entities/user.entity'
import { RoleEntity } from '../src/entities/role.entity'
import { MenuEntity } from '../src/entities/menu.entity'
import { DictEntity } from '../src/entities/dict.entity'
import { UserRoleEntity } from '../src/entities/user-role.entity'
import { RoleMenuEntity } from '../src/entities/role-menu.entity'

// 数据源配置：与 app.module.ts 中 TypeOrmModule.forRoot 保持一致
const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  // env 值可能为 undefined，需提供字符串默认值给 parseInt
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'nodeadmin',
  charset: process.env.DB_CHARSET || 'utf8mb4',
  timezone: '+08:00',
  entities: [UserEntity, RoleEntity, MenuEntity, DictEntity, UserRoleEntity, RoleMenuEntity],
  synchronize: true,
  logging: true,
})

async function init() {
  try {
    await AppDataSource.initialize()
    // 初始化成功后会打印每张表的 CREATE / ALTER SQL（依赖 logging:true）
    console.log('数据库表结构初始化完成。')
    await AppDataSource.destroy()
  } catch (error) {
    console.error('数据库初始化失败：', error)
    process.exit(1)
  }
}

init()
