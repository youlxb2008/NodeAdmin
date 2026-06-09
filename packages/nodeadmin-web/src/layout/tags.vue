<!--
  标签栏
  - 自动追踪路由变化，把当前页加入标签列表
  - 支持单个关闭、关闭其他、关闭全部
  - 与 keep-alive 配合实现页面状态缓存
-->
<template>
  <div v-if="tags.show" class="tags">
    <ul>
      <li
        v-for="(item, index) in tags.list"
        :key="item.path"
        class="tags-li"
        :class="{ active: isActive(item.path) }"
      >
        <router-link :to="item.path" class="tags-li-title">{{ item.title }}</router-link>
        <el-icon class="tags-close-icon" @click="closeTags(index)"><Close /></el-icon>
      </li>
    </ul>
    <div class="tags-close-box">
      <el-dropdown @command="handleTags">
        <el-button size="small" type="primary">
          标签选项
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu size="small">
            <el-dropdown-item command="other">关闭其他</el-dropdown-item>
            <el-dropdown-item command="all">关闭所有</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import type { RouteLocationNormalized } from 'vue-router'
import { useTagsStore } from '../store/tags'

const route = useRoute()
const router = useRouter()
const tags = useTagsStore()

/** 判断指定标签是否为当前激活状态 */
function isActive(path: string): boolean {
  return path === route.fullPath
}

/**
 * 关闭指定索引的标签
 * - 若关闭的是当前标签则自动跳到相邻标签
 * - 列表清空则跳回首页
 */
function closeTags(index: number): void {
  const delItem = tags.list[index]
  tags.delTagsItem(index)
  const item = tags.list[index] ? tags.list[index] : tags.list[index - 1]
  if (item) {
    if (delItem.path === route.fullPath) {
      router.push(item.path)
    }
  } else {
    router.push('/')
  }
}

/**
 * 把指定路由加入标签列表
 * - 若已存在则跳过
 * - 超过 8 个时移除最早的，避免标签过多
 */
function setTags(target: RouteLocationNormalized): void {
  const exists = tags.list.some(item => item.path === target.fullPath)
  if (exists) return
  // 控制标签数量上限
  if (tags.list.length >= 8) tags.delTagsItem(0)
  tags.setTagsItem({
    name: String(target.name || target.fullPath),
    title: String(target.meta?.title || '未命名'),
    path: target.fullPath,
  })
}

// 首次进入时同步当前路由
setTags(route)

// 路由更新时同步标签
onBeforeRouteUpdate(to => {
  setTags(to)
})

/** 关闭全部标签，跳转首页 */
function closeAll(): void {
  tags.clearTags()
  router.push('/')
}

/** 关闭其他标签，仅保留当前激活项 */
function closeOther(): void {
  const curItem = tags.list.filter(item => item.path === route.fullPath)
  tags.closeTagsOther(curItem)
}

/** 下拉菜单命令处理 */
function handleTags(command: string): void {
  if (command === 'other') closeOther()
  else closeAll()
}
</script>

<style scoped>
.tags {
  position: relative;
  height: var(--na-tags-height);
  overflow: hidden;
  background: var(--na-bg-container);
  padding-right: 120px;
  box-shadow: 6px 5px 4px var(--na-border-lighter);
}

.tags ul {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  list-style: none;
}

.tags-li {
  display: flex;
  align-items: center;
  float: left;
  margin: 3px 5px 2px 3px;
  border-radius: 3px;
  font-size: 12px;
  overflow: hidden;
  cursor: pointer;
  height: 23px;
  border: 1px solid var(--na-border-light);
  background: var(--na-bg-container);
  padding: 0 5px 0 12px;
  color: var(--na-text-regular);
  transition: all 0.3s ease-in;
}

.tags-li:not(.active):hover {
  background: var(--na-bg-hover);
}

.tags-li.active {
  color: #fff;
  background-color: var(--na-primary);
  border-color: var(--na-primary);
}

.tags-li-title {
  float: left;
  max-width: 80px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin-right: 5px;
  color: var(--na-text-regular);
}

.tags-li.active .tags-li-title {
  color: #fff;
}

.tags-close-icon {
  cursor: pointer;
  font-size: 12px;
}

.tags-close-box {
  position: absolute;
  right: 0;
  top: 0;
  box-sizing: border-box;
  padding-top: 1px;
  text-align: center;
  width: 110px;
  height: var(--na-tags-height);
  background: var(--na-bg-container);
  box-shadow: -3px 0 15px 3px rgba(0, 0, 0, 0.1);
  z-index: 10;
}
</style>
