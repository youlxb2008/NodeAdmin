/**
 * 根模块（AppModule）
 *
 * 职责：
 *   1. 注册全局配置（ConfigModule）与数据库连接（TypeOrmModule）
 *   2. 注册业务模块：Auth / User / Role / Menu / Dict / Dashboard / Seed
 *   3. 通过 APP_GUARD 注册全局守卫：JwtAccessGuard（认证）+ PermissGuard（按钮级权限）
 *   4. 通过 APP_INTERCEPTOR 注册全局响应包装拦截器 TransformInterceptor
 *   5. 绑定全局请求日志中间件
 */
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import { RoleModule } from './modules/role/role.module'
import { MenuModule } from './modules/menu/menu.module'
import { DictModule } from './modules/dict/dict.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { SeedModule } from './modules/seed/seed.module'
import { FileModule } from './modules/file/file.module'
import { SiteModule } from './modules/site/site.module'
import { CronModule } from './modules/cron/cron.module'
import { JwtAccessGuard } from './common/guards/jwt-access.guard'
import { PermissGuard } from './common/guards/permiss.guard'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { LoggerMiddleware } from './common/middleware/logger.middleware'
import { buildDatabaseConfig, DbType } from './config/database'

@Module({
  imports: [
    // 环境变量配置（全局可注入 ConfigService）
    ConfigModule.forRoot({ isGlobal: true }),
    // 根据 DB_TYPE 环境变量动态选择数据库（sqlite / mysql）
    TypeOrmModule.forRoot(buildDatabaseConfig((process.env.DB_TYPE as DbType) || 'sqlite')),

    // ============ 业务模块 ============
    // 认证模块：登录 / 登出 / 修改密码 / 当前用户 / 初始化状态
    AuthModule,
    // 用户管理 CRUD + 分配角色
    UserModule,
    // 角色管理 CRUD + 分配菜单
    RoleModule,
    // 菜单 / 按钮 CRUD（树形）
    MenuModule,
    // 字典管理 CRUD
    DictModule,
    // 仪表盘统计
    DashboardModule,
    // 启动 Seed：首次启动自动注入超管账号 / 角色 / 菜单
    SeedModule,
    // 文件上传模块：头像上传等
    FileModule,
    // 站点设置模块：站点标题、登录页背景图配置
    SiteModule,
    // 定时任务模块：动态调度、执行日志、处理器管理
    CronModule,
  ],
  providers: [
    // 全局 JWT 访问守卫：所有路由默认需要认证（通过 @Public / @OptionalAuth 豁免）
    { provide: APP_GUARD, useClass: JwtAccessGuard },
    // 全局按钮级权限守卫：未标注 @Permiss 的路由直接放行
    { provide: APP_GUARD, useClass: PermissGuard },
    // 全局响应包装拦截器：service 返回裸数据自动包装为 { code, data }
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule implements NestModule {
  /** 注册全局请求日志中间件，覆盖所有路由 */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
