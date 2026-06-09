/**
 * 用户模块（UserModule）
 *
 * 注册 UserController + UserService，
 * 导入 User / Role / UserRole 实体以支持 TypeORM 注解注入。
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { UserEntity } from '../../entities/user.entity'
import { RoleEntity } from '../../entities/role.entity'
import { UserRoleEntity } from '../../entities/user-role.entity'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoleEntity, UserRoleEntity])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
