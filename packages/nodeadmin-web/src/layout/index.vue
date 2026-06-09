<!--
  布局根组件
  - 三段式布局：header（顶部） + sidebar（左侧） + content-box（主区域）
  - 主区域内包含 tags（标签栏） + router-view（页面）
  - router-view 配合 keep-alive 缓存已打开的标签页
  - 支持布局宽度配置（default / compact），通过 CSS 变量动态调整
-->
<template>
  <div class="layout-wrapper" :class="`layout-${siteStore.layoutWidth}`">
    <v-header />
    <v-sidebar />
    <div class="content-box" :class="{ 'content-collapse': sidebar.collapse }">
      <v-tags />
      <div class="content">
        <router-view v-slot="{ Component }">
          <transition name="move" mode="out-in">
            <keep-alive :include="tags.nameList">
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSidebarStore } from '../store/sidebar'
import { useTagsStore } from '../store/tags'
import { useSiteStore } from '../store/site'
import vHeader from './header.vue'
import vSidebar from './sidebar.vue'
import vTags from './tags.vue'

const sidebar = useSidebarStore()
const tags = useTagsStore()
const siteStore = useSiteStore()
</script>

<style scoped>
.layout-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 紧凑布局：收窄 header 高度和 sidebar 宽度 */
.layout-compact {
  --na-header-height: 50px;
  --na-sidebar-width: 160px;
  --na-sidebar-collapse-width: 45px;
}
</style>
