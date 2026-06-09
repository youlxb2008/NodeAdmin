/**
 * 站点设置服务（SiteService）
 *
 * 管理站点全局配置，基于 options 表的 key-value 模式。
 * 当前支持的配置项：
 *   - title：站点标题
 *   - loginBg：登录页背景图路径
 *
 * value 以 JSON 字符串形式存储在 options 表中。
 */
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OptionEntity } from '../../entities/option.entity'
import * as path from 'path'
import * as fs from 'fs'

/** 站点配置在 options 表中的唯一键 */
const SITE_CONFIG_KEY = 'site_config'

/** 站点配置数据结构 */
export interface SiteConfig {
  /** 站点标题 */
  title: string
  /** 登录页背景图路径 */
  loginBg: string
  /** 布局宽度模式：default=默认，compact=紧凑 */
  layoutWidth: 'default' | 'compact'
}

/** 更新站点配置的参数 */
export interface UpdateSiteDto {
  /** 站点标题（1-50 字符） */
  title?: string
  /** 登录页背景图路径（最大 512 字符） */
  loginBg?: string
  /** 布局宽度模式 */
  layoutWidth?: 'default' | 'compact'
}

@Injectable()
export class SiteService {
  constructor(
    @InjectRepository(OptionEntity)
    private readonly optionRepo: Repository<OptionEntity>,
  ) {}

  /**
   * 获取管理端站点配置
   *
   * 读取 options 表中 key='site_config' 的记录，
   * 解析 JSON 返回完整的站点配置对象。
   *
   * @returns 站点配置（title + loginBg）
   */
  async getAdmin(): Promise<SiteConfig> {
    const option = await this.optionRepo.findOne({ where: { key: SITE_CONFIG_KEY } })
    if (!option) {
      // 首次访问，尚未配置过，返回默认值
      return { title: '', loginBg: '', layoutWidth: 'default' }
    }
    return JSON.parse(option.value) as SiteConfig
  }

  /**
   * 获取公开站点配置（给登录页使用）
   *
   * 仅返回前端登录页所需的配置字段。
   *
   * @returns 站点配置（title + loginBg）
   */
  async getPublic(): Promise<SiteConfig> {
    const option = await this.optionRepo.findOne({ where: { key: SITE_CONFIG_KEY } })
    if (!option) {
      return { title: '', loginBg: '', layoutWidth: 'default' }
    }
    return JSON.parse(option.value) as SiteConfig
  }

  /**
   * 更新站点配置
   *
   * 业务流程：
   *   1. 校验 title 长度（1-50 字符）
   *   2. 校验 loginBg 长度（最大 512 字符）
   *   3. 读取现有配置，合并更新字段
   *   4. 若 loginBg 发生变更且旧值以 /uploads/login-bg/ 开头，删除旧文件
   *   5. 写入 options 表
   *
   * @param dto 更新参数（支持部分更新）
   * @returns 更新后的完整配置
   */
  async updateSite(dto: UpdateSiteDto): Promise<SiteConfig> {
    // 步骤 1：校验 title 长度
    if (dto.title !== undefined) {
      if (!dto.title || dto.title.length > 50) {
        throw new BadRequestException('站点标题长度应在 1-50 个字符之间')
      }
    }

    // 步骤 2：校验 loginBg 长度
    if (dto.loginBg !== undefined) {
      if (dto.loginBg.length > 512) {
        throw new BadRequestException('登录背景图路径最大 512 个字符')
      }
    }

    // 步骤 3：读取现有配置，合并更新字段
    const option = await this.optionRepo.findOne({ where: { key: SITE_CONFIG_KEY } })
    let oldConfig: SiteConfig = { title: '', loginBg: '', layoutWidth: 'default' }
    if (option) {
      oldConfig = JSON.parse(option.value) as SiteConfig
    }

    const newConfig: SiteConfig = {
      title: dto.title !== undefined ? dto.title : oldConfig.title,
      loginBg: dto.loginBg !== undefined ? dto.loginBg : oldConfig.loginBg,
      layoutWidth: dto.layoutWidth !== undefined ? dto.layoutWidth : oldConfig.layoutWidth,
    }

    // 步骤 4：若 loginBg 变更且旧值为本地上传文件，删除旧文件
    if (
      dto.loginBg !== undefined &&
      oldConfig.loginBg &&
      oldConfig.loginBg.startsWith('/uploads/login-bg/') &&
      oldConfig.loginBg !== dto.loginBg
    ) {
      deleteLocalFile(oldConfig.loginBg)
    }

    // 步骤 5：写入 options 表（upsert）
    if (option) {
      option.value = JSON.stringify(newConfig)
      await this.optionRepo.save(option)
    } else {
      const newOption = this.optionRepo.create({
        key: SITE_CONFIG_KEY,
        value: JSON.stringify(newConfig),
        extend: '',
      })
      await this.optionRepo.save(newOption)
    }

    return newConfig
  }
}

/**
 * 删除本地文件的辅助函数
 *
 * 根据相对路径（如 /uploads/login-bg/20260609/abc.png）
 * 定位到实际磁盘文件并删除。
 *
 * @param relativePath 文件的相对路径，以 / 开头
 */
export function deleteLocalFile(relativePath: string): void {
  // 获取上传根目录，优先使用环境变量，否则使用项目根目录下的 uploads 文件夹
  const uploadRoot = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
  // 去掉开头的 / 拼接为完整路径
  const fullPath = path.join(uploadRoot, relativePath.replace(/^\//, ''))
  // 检查文件是否存在再删除，避免异常
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath)
  }
}
