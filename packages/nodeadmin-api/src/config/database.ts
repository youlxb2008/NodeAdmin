/**
 * 数据库配置 factory
 *
 * 根据 DB_TYPE 环境变量动态构建 TypeORM 连接配置：
 * - sqlite：使用 sqljs 驱动，文件存储在 DB_PATH，零配置开箱即用
 * - mysql：使用 mysql2 驱动，连接 MySQL 5.7+
 *
 * 两种模式共享同一套 entity 定义和 seed 逻辑，
 * 切换数据库只需修改 .env 中的 DB_TYPE 即可。
 */
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import * as path from 'path'
import * as fs from 'fs'

/**
 * 支持的数据库类型
 */
export type DbType = 'sqlite' | 'mysql'

/**
 * 构建 TypeORM 连接配置
 *
 * @param dbType 数据库类型，从 DB_TYPE 环境变量读取，默认 sqlite
 * @returns TypeORM 模块配置对象
 */
export function buildDatabaseConfig(dbType: DbType = 'sqlite'): TypeOrmModuleOptions {
  // 两种数据库共用的基础配置
  const common = {
    // 自动扫描所有 entity 文件
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    // 自动同步表结构，通过 DB_SYNCHRONIZE 环境变量控制，默认 true
    synchronize: process.env.DB_SYNCHRONIZE !== 'false',
    // 仅非生产环境打印 SQL 日志
    logging: process.env.NODE_ENV !== 'production',
  }

  if (dbType === 'mysql') {
    return {
      ...common,
      type: 'mysql' as const,
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'nodeadmin',
      // MySQL 5.7 兼容：使用 utf8mb4 支持 emoji 和完整 Unicode
      charset: 'utf8mb4',
      // 时区设置为中国标准时间
      timezone: '+08:00',
      // 连接池配置
      extra: {
        connectionLimit: 10,
      },
    }
  }

  // 默认 SQLite（sqljs 纯 JS 实现，无需 native 编译）
  const dbPath = process.env.DB_PATH || './data/nodeadmin.db'
  // 确保数据库文件的父目录存在，避免 sqljs 初始化时因目录缺失而报错
  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  return {
    ...common,
    type: 'sqljs' as const,
    // 数据库文件路径，默认存放在项目 api 目录下的 data/nodeadmin.db
    location: dbPath,
    // 自动保存变更到文件
    autoSave: true,
  }
}
