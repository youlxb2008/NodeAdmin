<!--
  侧边栏
  - 菜单数据来自 useMenuStore（后端下发的菜单树）
  - 递归渲染多级菜单
  - 每一项 v-permiss 过滤（按钮类型本就不会渲染菜单，菜单类型若 perm 不通过也隐藏）
  - 图标使用 Iconify 渲染（菜单 icon 字段如 'ph:house'）
-->
<template>
  <div
    class="sidebar"
    :class="{ collapsed: sidebar.collapse, 'sidebar-compact': siteStore.layoutWidth === 'compact' }"
  >
    <el-menu
      class="sidebar-el-menu"
      :default-active="activeRoute"
      :collapse="sidebar.collapse"
      :background-color="bgColor"
      :text-color="textColor"
      :active-text-color="activeColor"
      unique-opened
      router
    >
      <menu-item v-for="item in menuStore.menus" :key="item.id" :node="item" />
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed, h, defineComponent, type PropType } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { ElMenu, ElSubMenu, ElMenuItem } from 'element-plus'
import { useSidebarStore } from '../store/sidebar'
import { useMenuStore } from '../store/menu'
import { usePermissStore } from '../store/permiss'
import { useSiteStore } from '../store/site'
import type { MenuTreeNode } from '@nodeadmin/shared'

// 显式引用 ElMenu 以避免在 render 函数中找不到组件（template 中通过 auto-import 解析）
void ElMenu

const sidebar = useSidebarStore()
const menuStore = useMenuStore()
const permissStore = usePermissStore()
const siteStore = useSiteStore()
const route = useRoute()

/** 当前激活的路由路径，用于菜单高亮 */
const activeRoute = computed(() => route.path)

// 主题色（保留写死的侧边栏配色以维持深色侧栏的视觉效果）
const bgColor = '#324157'
const textColor = '#bfcbd9'
const activeColor = '#20a0ff'

/**
 * 判断菜单节点是否对当前用户可见
 * - 隐藏菜单不渲染
 * - 类型必须是 'M'（菜单）
 * - 若 perm 字段不为空，则需通过权限校验
 */
function isVisible(node: MenuTreeNode): boolean {
  if (node.hidden) return false
  if (node.type !== 'M') return false
  if (node.perm && !permissStore.has(node.perm)) return false
  return true
}

/**
 * MenuItem 递归组件
 *
 * 使用 defineComponent + h 渲染函数避免在 SFC 中拆分多文件，
 * 同时支持任意层级嵌套（sub-menu 多层）。
 */
const MenuItem = defineComponent({
  name: 'MenuItem',
  props: {
    node: {
      type: Object as PropType<MenuTreeNode>,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const node = props.node
      if (!isVisible(node)) return null

      // 仅渲染可见的子节点
      const visibleChildren = (node.children || []).filter(isVisible)

      // 菜单项图标（使用 Iconify）
      const iconVNode = node.icon
        ? h(Icon, {
            icon: node.icon,
            class: 'menu-icon',
          })
        : null

      // 有可见子节点 → sub-menu
      if (visibleChildren.length > 0) {
        return h(
          ElSubMenu,
          {
            index: String(node.id),
            // 折叠状态下 hover 弹层挂载到 body，需 popper-class 注入全局样式
            // 再用动态 left 让弹层紧贴 sidebar 右边缘
            popperClass:
              siteStore.layoutWidth === 'compact'
                ? 'sidebar-menu-popper sidebar-menu-popper-compact'
                : 'sidebar-menu-popper',
            popperStyle: {
              // 折叠菜单的可见宽度 = --na-sidebar-collapse-width
              // 弹层紧贴折叠菜单右边缘，留出适当间隙：宽版 6px，窄版 4px
              left: `calc(var(--na-sidebar-collapse-width, ${siteStore.layoutWidth === 'compact' ? '45px' : '65px'}) + ${siteStore.layoutWidth === 'compact' ? '4px' : '6px'})`,
            },
          },
          {
            title: () => [iconVNode, h('span', node.name)],
            default: () =>
              visibleChildren.map(child => h(MenuItem, { node: child, key: child.id })),
          },
        )
      }

      // 叶子 → menu-item
      return h(
        ElMenuItem,
        { index: node.path || String(node.id) },
        {
          default: () => [iconVNode, h('span', node.name)],
        },
      )
    }
  },
})
</script>

<style scoped>
.sidebar {
  display: block;
  position: absolute;
  left: 0;
  top: var(--na-header-height);
  bottom: 0;
  width: var(--na-sidebar-width);
  overflow-y: auto;
  background: #324157;
  transition: width 0.3s ease-in-out;
}
.sidebar .el-menu {
  border-right: 0;
}

.sidebar.collapsed {
  width: var(--na-sidebar-collapse-width);
}

.sidebar::-webkit-scrollbar {
  width: 0;
}

.sidebar-el-menu:not(.el-menu--collapse) {
  width: var(--na-sidebar-width);
  border-right: none;
}

.sidebar > ul {
  height: 100%;
}

.sidebar-el-menu :deep(.el-menu-item),
.sidebar-el-menu :deep(.el-sub-menu__title) {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-el-menu :deep(.menu-icon) {
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  font-size: 18px;
  line-height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 紧凑模式：缩小字体、图标、菜单项高度 */
.sidebar-compact .sidebar-el-menu :deep(.el-menu-item),
.sidebar-compact .sidebar-el-menu :deep(.el-sub-menu__title) {
  height: 40px;
  line-height: 40px;
  font-size: 12px;
  gap: 6px;
  padding: 0 12px !important;
}

.sidebar-compact .sidebar-el-menu :deep(.menu-icon) {
  flex: 0 0 14px;
  width: 14px;
  height: 14px;
  font-size: 14px;
  line-height: 14px;
}

.sidebar-compact .sidebar-el-menu :deep(.el-sub-menu .el-menu-item) {
  height: 36px;
  line-height: 36px;
  font-size: 12px;
  padding-left: 36px !important;
}
</style>
