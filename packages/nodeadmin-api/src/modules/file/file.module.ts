/**
 * 文件模块（FileModule）
 *
 * 提供文件上传相关服务，目前主要支持头像上传。
 */
import { Module } from '@nestjs/common'
import { FileController } from './file.controller'
import { FileService } from './file.service'

@Module({
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
