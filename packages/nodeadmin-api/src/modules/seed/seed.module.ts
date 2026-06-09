/**
 * 启动 Seed 模块（SeedModule）
 *
 * 注册 SeedService（含 OnModuleInit 钩子），
 * 导入 User / Role / Menu / UserRole / RoleMenu 实体以支持完整 seed 写入。
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SeedService } from './seed.service'
import { UserEntity } from '../../entities/user.entity'
import { RoleEntity } from '../../entities/role.entity'
import { MenuEntity } from '../../entities/menu.entity'
import { UserRoleEntity } from '../../entities/user-role.entity'
import { RoleMenuEntity } from '../../entities/role-menu.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RoleEntity, MenuEntity, UserRoleEntity, RoleMenuEntity]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
