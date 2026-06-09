/**
 * 站点设置模块（SiteModule）
 *
 * 注册 SiteController + SiteService，
 * 导入 OptionEntity 以支持 TypeORM 注入。
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OptionEntity } from '../../entities/option.entity'
import { SiteController } from './site.controller'
import { SiteService } from './site.service'

@Module({
  imports: [TypeOrmModule.forFeature([OptionEntity])],
  controllers: [SiteController],
  providers: [SiteService],
  exports: [SiteService],
})
export class SiteModule {}
