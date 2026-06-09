/**
 * 菜单模块（MenuModule）
 *
 * 注册 MenuController + MenuService，
 * 导入 Menu / RoleMenu 实体以支持 TypeORM 注解注入。
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MenuController } from './menu.controller'
import { MenuService } from './menu.service'
import { MenuEntity } from '../../entities/menu.entity'
import { RoleMenuEntity } from '../../entities/role-menu.entity'

@Module({
  imports: [TypeOrmModule.forFeature([MenuEntity, RoleMenuEntity])],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
