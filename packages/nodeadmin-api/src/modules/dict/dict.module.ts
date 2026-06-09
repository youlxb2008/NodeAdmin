/**
 * 字典模块（DictModule）
 *
 * 注册 DictController + DictService，
 * 导入 Dict 实体以支持 TypeORM 注解注入。
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DictController } from './dict.controller'
import { DictService } from './dict.service'
import { DictEntity } from '../../entities/dict.entity'

@Module({
  imports: [TypeOrmModule.forFeature([DictEntity])],
  controllers: [DictController],
  providers: [DictService],
  exports: [DictService],
})
export class DictModule {}
