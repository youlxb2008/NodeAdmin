/**
 * 仪表盘模块（DashboardModule）
 *
 * 注册 DashboardController + DashboardService，
 * 导入 User / Role / Menu / Dict 实体以支持各类 count 统计查询。
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'
import { UserEntity } from '../../entities/user.entity'
import { RoleEntity } from '../../entities/role.entity'
import { MenuEntity } from '../../entities/menu.entity'
import { DictEntity } from '../../entities/dict.entity'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoleEntity, MenuEntity, DictEntity])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
