/**
 * 认证模块（AuthModule）
 *
 * 职责：
 *   1. 注册 AuthController（登录 / 登出 / 获取用户 / 修改密码 / 初始化状态）
 *   2. 注册 AuthService（密码校验 / JWT 签发 / 菜单树构建）
 *   3. 注册 PassportModule + AccessStrategy（JWT 验证）
 *   4. 注册 JwtModule（签发 Token）
 *   5. 导入 User / Menu 实体以支持 TypeORM 注解注入
 */
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AccessStrategy } from './strategies/access.strategy'
import { UserEntity } from '../../entities/user.entity'
import { MenuEntity } from '../../entities/menu.entity'

@Module({
  imports: [
    // 默认 passport 策略名为 'jwt-access'，与 AccessStrategy 一致
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    // JwtModule.register({}) 表示使用默认配置；具体 secret/expiresIn 在 AuthService 中动态指定
    JwtModule.register({}),
    // 声明本模块使用的 TypeORM 实体，以便注入对应的 Repository
    TypeOrmModule.forFeature([UserEntity, MenuEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessStrategy],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
