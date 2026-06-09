﻿﻿/**
 * IconPicker 本地图标清单
 *
 * 图标数据来源于 src/assets/iconify/*.json，由 main.ts 通过 addCollection 注册。
 * 这里直接读取本地 JSON 的 icons 字段生成候选项，确保图标选择器只展示本地已有 SVG 数据，
 * 避免运行时请求 Iconify CDN，也避免手写不存在的图标名称。
 */
import phIcons from '@/assets/iconify/ph.json'
import mdiIcons from '@/assets/iconify/mdi.json'
import tablerIcons from '@/assets/iconify/tabler.json'

interface IconifyCollection {
  prefix: string
  icons: Record<string, unknown>
}

/**
 * 将本地 Iconify collection 转换为 Iconify 标准图标名。
 * @param collection 本地 Iconify JSON 集合
 */
function getCollectionIconNames(collection: IconifyCollection): string[] {
  return Object.keys(collection.icons).map(name => `${collection.prefix}:${name}`)
}

/** 本地已注册的 Iconify 图标清单 */
export const presetIcons = [
  ...getCollectionIconNames(phIcons),
  ...getCollectionIconNames(mdiIcons),
  ...getCollectionIconNames(tablerIcons),
]
