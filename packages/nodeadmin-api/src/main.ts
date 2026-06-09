/**
 * NestJS 应用入口文件
 * 职责：装配根模块、注册全局中间件 / 管道 / 异常过滤器、启动 HTTP 服务
 */
import { NestFactory } from '@nestjs/core'
import { Logger, ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { json, urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import * as path from 'path'
import * as fs from 'fs'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // 启用 NestJS 内置 Logger，开发环境打印详细日志
    logger: ['log', 'debug', 'error', 'warn', 'fatal', 'verbose'],
  })

  // 全局 API 前缀：所有路由自动加上 /api 前缀
  app.setGlobalPrefix('api')

  // Cookie 解析中间件（用于 access_token 等 HttpOnly Cookie 模式）
  app.use(cookieParser())

  // 请求体大小限制：通过环境变量配置，默认 10mb
  const bodyLimit = process.env.BODY_LIMIT || '10mb'
  app.use(json({ limit: bodyLimit }))
  app.use(urlencoded({ extended: true, limit: bodyLimit }))

  // 静态文件服务：/uploads/* 映射到本地 UPLOAD_DIR 目录
  const uploadDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads')
  // 上传根目录不存在则自动创建，避免静态托管初始化报错
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' })

  // CORS 跨域配置：从环境变量读取白名单
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174'
  app.enableCors({
    origin: corsOrigin.split(','),
    credentials: true, // 允许携带 Cookie（access_token）
  })

  // 全局异常过滤器：统一 JSON 错误格式
  app.useGlobalFilters(new AllExceptionsFilter())

  // 全局验证管道：自动校验 DTO，剥离多余字段
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动删除 DTO 中未定义的字段
      forbidNonWhitelisted: true, // 出现未定义字段时抛 400
      transform: true, // 自动将普通对象转换为 DTO 类实例
    }),
  )

  const port = process.env.PORT || 3000
  await app.listen(port)
  const dbType = process.env.DB_TYPE || 'sqlite'
  logger.log(`服务已启动: http://localhost:${port}/api`)
  logger.log(`数据库类型: ${dbType}`)
  logger.debug(`CORS 白名单: ${corsOrigin}`)
  logger.debug(`上传目录: ${uploadDir}`)
}
bootstrap()
