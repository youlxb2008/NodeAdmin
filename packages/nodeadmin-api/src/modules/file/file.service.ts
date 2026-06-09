/**
 * 文件服务（FileService）
 *
 * 提供头像上传文件的校验、存储等能力。
 */
import { BadRequestException, Injectable } from '@nestjs/common'
import * as path from 'path'
import * as fs from 'fs'
import dayjs from 'dayjs'
import {
  getUploadDir,
  ensureDir,
  generateFileName,
  getImageExt,
} from '../../common/utils/upload.util'

/** 允许上传的图片 MIME 类型白名单 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** 最大允许文件大小：5MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024

@Injectable()
export class FileService {
  /**
   * 保存头像文件
   *
   * 业务流程：
   *   1. 校验文件大小（最大 5MB）
   *   2. 校验 MIME 类型（仅允许 jpeg/png/webp/gif）
   *   3. 生成文件名：SHA256 前 16 位 + 扩展名
   *   4. 保存到 uploads/avatar/YYYYMMDD/ 目录
   *   5. 返回可供 HTTP 访问的相对路径
   *
   * @param file Express.Multer.File 对象
   * @returns 头像访问相对路径，如 /uploads/avatar/20260608/abc123.png
   */
  saveAvatar(file: Express.Multer.File): string {
    // 步骤 1：文件大小校验
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('文件大小超过限制，最大允许 5MB')
    }

    // 步骤 2：MIME 类型校验
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('不支持的图片格式，仅支持 jpeg、png、webp、gif')
    }

    // 步骤 3：生成文件名
    const ext = getImageExt(file.mimetype)
    const hashName = generateFileName(file.buffer)
    const fileName = `${hashName}${ext}`

    // 步骤 4：构建目标目录（按日期分目录）
    const dateDir = dayjs().format('YYYYMMDD')
    const uploadRoot = getUploadDir()
    const avatarDir = path.join(uploadRoot, 'avatar', dateDir)
    ensureDir(avatarDir)

    // 步骤 5：写入文件
    const filePath = path.join(avatarDir, fileName)
    fs.writeFileSync(filePath, file.buffer)

    // 步骤 6：返回相对路径（供前端直接展示）
    return `/uploads/avatar/${dateDir}/${fileName}`
  }

  /**
   * 保存登录页背景图
   *
   * 存储路径：uploads/login-bg/YYYYMMDD/<hash>.<ext>
   * 业务流程与 saveAvatar 相同，子目录为 login-bg。
   *
   * @param file Express.Multer.File 对象
   * @returns 背景图访问相对路径，如 /uploads/login-bg/20260608/abc123.png
   */
  saveLoginBg(file: Express.Multer.File): string {
    // 步骤 1：文件大小校验
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('文件大小超过限制，最大允许 5MB')
    }

    // 步骤 2：MIME 类型校验
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('不支持的图片格式，仅支持 jpeg、png、webp、gif')
    }

    // 步骤 3：生成文件名
    const ext = getImageExt(file.mimetype)
    const hashName = generateFileName(file.buffer)
    const fileName = `${hashName}${ext}`

    // 步骤 4：构建目标目录（按日期分目录）
    const dateDir = dayjs().format('YYYYMMDD')
    const uploadRoot = getUploadDir()
    const loginBgDir = path.join(uploadRoot, 'login-bg', dateDir)
    ensureDir(loginBgDir)

    // 步骤 5：写入文件
    const filePath = path.join(loginBgDir, fileName)
    fs.writeFileSync(filePath, file.buffer)

    // 步骤 6：返回相对路径（供前端直接展示）
    return `/uploads/login-bg/${dateDir}/${fileName}`
  }
}
