<!--
  顶部 Header
  - 左侧：折叠按钮 + 系统 Logo
  - 右侧：主题切换 + 用户头像 + 下拉菜单（个人中心 / 修改密码 / 退出登录）
-->
<template>
  <div class="header">
    <!-- 折叠按钮 -->
    <div class="collapse-btn" @click="toggleCollapse">
      <el-icon v-if="sidebar.collapse"><Expand /></el-icon>
      <el-icon v-else><Fold /></el-icon>
    </div>
    <div class="logo">{{ siteStore.title || 'NodeAdmin' }}</div>

    <div class="header-right">
      <div class="header-user-con">
        <!-- 用户头像 -->
        <el-avatar class="user-avator" :size="32" :src="avatarUrl">
          {{ avatarInitial }}
        </el-avatar>

        <!-- 用户下拉菜单 -->
        <el-dropdown class="user-name" trigger="click" @command="handleCommand">
          <span class="el-dropdown-link">
            {{ userStore.nickname }}
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="password">修改密码</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useSidebarStore } from '../store/sidebar'
import { useUserStore } from '../store/user'
import { usePermissStore } from '../store/permiss'
import { useMenuStore } from '../store/menu'
import { useSiteStore } from '../store/site'
import { logout } from '../api/auth'
import { setAuthenticated, resetDynamicRoutes } from '../router'

const sidebar = useSidebarStore()
const userStore = useUserStore()
const permissStore = usePermissStore()
const menuStore = useMenuStore()
const siteStore = useSiteStore()
const router = useRouter()

/** 头像 URL；未设置时使用空字符串（el-avatar 会显示首字母 fallback） */
const avatarUrl = computed(() => userStore.userInfo?.avatar || '')

/** 头像首字母（avatar 为空时显示） */
const avatarInitial = computed(() => {
  const name = userStore.nickname
  return name ? name.charAt(0).toUpperCase() : 'U'
})

/** 切换侧边栏折叠状态 */
function toggleCollapse(): void {
  sidebar.handleCollapse()
}

/**
 * 下拉菜单命令处理
 * @param command 命令名：profile | password | logout
 */
async function handleCommand(command: string): Promise<void> {
  if (command === 'logout') {
    try {
      // 调用后端登出接口（清除 HttpOnly Cookie）
      await logout()
    } catch {
      // 网络错误也继续清理本地状态，确保会话被销毁
    }
    // 清理 store 与动态路由标记
    userStore.clearUser()
    permissStore.clearPerms()
    menuStore.clearMenus()
    setAuthenticated(false)
    resetDynamicRoutes()
    ElMessage.success('已退出登录')
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile/index')
  } else if (command === 'password') {
    router.push('/profile/password')
  }
}
</script>

<style scoped>
.header {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: var(--na-header-height);
  background-color: var(--na-bg-header);
  color: var(--na-text-inverse);
  font-size: 22px;
  z-index: 100;
}

.collapse-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  float: left;
  padding: 0 21px;
  cursor: pointer;
  transition: background 0.2s;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.logo {
  float: left;
  width: 250px;
  line-height: var(--na-header-height);
  font-weight: 600;
  letter-spacing: 1px;
}

.header-right {
  float: right;
  padding-right: 50px;
}

.header-user-con {
  display: flex;
  height: var(--na-header-height);
  align-items: center;
  gap: 16px;
}

.user-avator {
  margin-left: 4px;
}

.user-name {
  margin-left: 4px;
}

.el-dropdown-link {
  color: var(--na-text-inverse);
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
}
</style>
