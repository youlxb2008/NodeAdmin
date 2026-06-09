/**
 * 角色模块（RoleModule）
 *
 * 注册 RoleController + RoleService，
 * 导入 Role / Menu / UserRole / RoleMenu 实体以支持 TypeORM 注解注入。
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoleController } from './role.controller'
import { RoleService } from './role.service'
import { RoleEntity } from '../../entities/role.entity'
import { MenuEntity } from '../../entities/menu.entity'
import { UserRoleEntity } from '../../entities/user-role.entity'
import { RoleMenuEntity } from '../../entities/role-menu.entity'

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity, MenuEntity, UserRoleEntity, RoleMenuEntity])],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
