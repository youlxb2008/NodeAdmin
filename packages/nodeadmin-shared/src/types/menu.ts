/**
 * 菜单 / 权限相关类型定义
 *
 * 菜单是 RBAC 中的最小授权单元，同一张表同时承载：
 *   - 'M'（Menu）：可点击的菜单项，对应一个前端路由
 *   - 'B'（Button）：按钮 / 接口级权限码，不渲染菜单，仅作为权限标识
 *
 * 通过 parentId 自引用形成树形结构，根节点 parentId = 0。
 */

/**
 * 菜单 / 权限节点类型
 *
 * - 'M' = Menu，菜单项，渲染到侧边栏
 * - 'B' = Button，按钮 / 接口权限，仅用于前端 v-perm 指令与后端 @RequirePerm 装饰器判断
 */
export type MenuType = 'M' | 'B'

/**
 * 菜单实体（对应菜单表）
 */
export interface Menu {
  /** 菜单主键 ID */
  id: number
  /** 父菜单 ID；0 表示根节点 */
  parentId: number
  /** 菜单名称（侧边栏展示文案） */
  name: string
  /** 前端路由路径，按钮类型可为空 */
  path: string
  /** 前端组件路径（相对 views/），按钮类型可为空 */
  component: string
  /** 图标标识（如 'lucide:user'），按钮类型可为空 */
  icon: string
  /** 节点类型：M=菜单，B=按钮 */
  type: MenuType
  /** 权限码（按钮必填、菜单可选，如 'system:user:add'） */
  perm: string
  /** 排序权重，值越小越靠前 */
  sort: number
  /** 是否在侧边栏隐藏（仍参与权限判断） */
  hidden: boolean
  /** 0=禁用 1=启用 */
  status: number
  /** 创建时间 ISO 字符串 */
  createdAt: string
  /** 更新时间 ISO 字符串 */
  updatedAt: string
}

/**
 * 菜单树节点
 *
 * 由扁平 Menu[] 按 parentId 派生而来；children 为该节点的直接子节点，
 * 叶子节点的 children 为空数组（而非 undefined），便于前端递归渲染。
 */
export interface MenuTreeNode extends Menu {
  /** 直接子节点列表（叶子节点为空数组） */
  children: MenuTreeNode[]
}

/**
 * 创建菜单请求体
 */
export interface CreateMenuDto {
  /** 父菜单 ID，根节点传 0 */
  parentId: number
  /** 菜单名称 */
  name: string
  /** 路由路径 */
  path?: string
  /** 组件路径 */
  component?: string
  /** 图标标识 */
  icon?: string
  /** 节点类型 */
  type: MenuType
  /** 权限码 */
  perm?: string
  /** 排序权重 */
  sort?: number
  /** 是否隐藏 */
  hidden?: boolean
  /** 状态 */
  status?: number
}

/**
 * 更新菜单请求体（部分更新）
 */
export interface UpdateMenuDto {
  /** 父菜单 ID */
  parentId?: number
  /** 菜单名称 */
  name?: string
  /** 路由路径 */
  path?: string
  /** 组件路径 */
  component?: string
  /** 图标标识 */
  icon?: string
  /** 节点类型 */
  type?: MenuType
  /** 权限码 */
  perm?: string
  /** 排序权重 */
  sort?: number
  /** 是否隐藏 */
  hidden?: boolean
  /** 状态 */
  status?: number
}
