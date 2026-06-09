/**
 * 文件控制器（FileController）
 *
 * 路由前缀：/api/admin/upload
 * 提供头像上传接口，需要登录态（不标记 @Public）。
 */
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { FileService } from './file.service'

@Controller('admin/upload')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  /**
   * 上传头像
   *
   * 使用 FileInterceptor 处理 multipart/form-data 中的 file 字段，
   * 交由 FileService 进行校验和持久化存储。
   *
   * @param file 上传的图片文件
   * @returns 头像访问 URL
   */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    const url = this.fileService.saveAvatar(file)
    return { url }
  }

  /**
   * 上传登录页背景图
   *
   * 完整路径：POST /api/admin/upload/login-bg
   * 使用 FileInterceptor 处理 multipart/form-data 中的 file 字段，
   * 交由 FileService 进行校验和持久化存储。
   *
   * @param file 上传的图片文件
   * @returns 背景图访问 URL
   */
  @Post('login-bg')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLoginBg(@UploadedFile() file: Express.Multer.File) {
    const url = this.fileService.saveLoginBg(file)
    return { url }
  }
}
