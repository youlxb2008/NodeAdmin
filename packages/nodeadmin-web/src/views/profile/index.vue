<!--
  个人中心 - 基本信息
  -------------------
  左右两栏：
    左侧 - 基本信息卡（头像 + 昵称 + 用户名 + 角色 Tag）
    右侧 - 编辑表单（昵称 / 邮箱 / 手机号），保存按钮调用 PUT /api/auth/profile
  头像点击打开 Cropper 裁剪弹窗（vue-advanced-cropper），结果以 base64 形式暂存并随表单提交。
-->
<template>
  <div>
    <PageHeader title="个人中心" />

    <el-row :gutter="20">
      <!-- 左侧：基本信息卡 -->
      <el-col :xs="24" :sm="24" :md="8" :lg="8">
        <el-card shadow="hover">
          <template #header><span>基本信息</span></template>

          <div class="profile-info">
            <!-- 头像区：点击打开裁剪弹窗 -->
            <div class="avatar-wrap" @click="openCropper">
              <el-avatar :size="100" :src="avatarBase64 || ''" class="avatar">
                {{ avatarInitial }}
              </el-avatar>
              <div class="avatar-hover">
                <Icon icon="ph:camera" style="font-size: 24px" />
              </div>
            </div>

            <div class="username">{{ userStore.nickname }}</div>
            <div class="account">@{{ userStore.userInfo?.username || '' }}</div>

            <div class="role-tags">
              <el-tag v-for="r in roleNames" :key="r" type="info" size="small" style="margin: 2px">
                {{ r }}
              </el-tag>
              <span v-if="!roleNames.length" class="na-muted">暂无角色信息</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：编辑表单 -->
      <el-col :xs="24" :sm="24" :md="16" :lg="16">
        <el-card shadow="hover">
          <template #header><span>资料编辑</span></template>

          <el-form :model="form" label-width="90px" style="max-width: 480px">
            <el-form-item label="用户名">
              <el-input v-model="form.username" disabled />
            </el-form-item>
            <el-form-item label="昵称">
              <el-input
                v-model="form.nickname"
                placeholder="显示昵称"
                maxlength="32"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="form.email" placeholder="邮箱地址" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="form.phone" placeholder="手机号" maxlength="11" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 头像裁剪弹窗 -->
    <el-dialog
      v-model="cropperVisible"
      title="裁剪头像"
      width="600px"
      :close-on-click-modal="false"
    >
      <Cropper
        ref="cropperRef"
        :src="imgSrc"
        :stencil-props="{ aspectRatio: 1 }"
        class="cropper-area"
        @change="onCropChange"
      />
      <template #footer>
        <span class="dialog-footer-actions">
          <el-button class="select-btn" type="primary">
            选择图片
            <input class="select-input" type="file" accept="image/*" @change="onFileChange" />
          </el-button>
          <el-button @click="cropperVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCroppedAvatar">保存到本地</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 头像上传状态提示 -->
    <el-alert
      v-if="uploadStatus"
      :type="uploadStatus.type"
      :closable="false"
      style="margin-top: 16px"
      :title="uploadStatus.title"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
// vue-advanced-cropper 的 Cropper 组件
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - 部分版本无 d.ts，运行时正常
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { useUserStore } from '../../store/user'
import { uploadImage } from '../../api/upload'
import { updateProfile } from '../../api/auth'

defineOptions({ name: 'profile-index' })

const userStore = useUserStore()

/** 编辑表单 */
const form = reactive({
  username: '',
  nickname: '',
  email: '',
  phone: '',
  avatar: '',
})

/** 保存中状态 */
const saving = ref(false)

/** 头像首字母（avatar 为空时显示） */
const avatarInitial = computed(() => {
  const name = userStore.nickname
  return name ? name.charAt(0).toUpperCase() : 'U'
})

/**
 * 当前用户角色名称列表
 * 从 userStore.userInfo.roles 读取，后端登录时返回
 */
const roleNames = computed<string[]>(() => userStore.userInfo?.roles || [])

/** 暂存的头像 base64（用于页面展示） */
const avatarBase64 = ref('')

/** 头像上传状态提示 */
const uploadStatus = ref<{ type: 'success' | 'warning'; title: string } | null>(null)

/* ========== 裁剪相关 ========== */
const cropperVisible = ref(false)
const imgSrc = ref('')
const croppedBase64 = ref('')
const cropperRef = ref()

/** 打开裁剪弹窗 */
function openCropper(): void {
  imgSrc.value = avatarBase64.value || ''
  cropperVisible.value = true
}

/** 选择本地图片文件 → 加载到裁剪器 */
function onFileChange(e: Event): void {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = ev => {
    imgSrc.value = (ev.target?.result as string) || ''
  }
  reader.readAsDataURL(file)
}

/** 裁剪区域变化：实时读取裁剪后的 base64 */
function onCropChange(payload: { canvas?: HTMLCanvasElement }): void {
  if (payload.canvas) {
    croppedBase64.value = payload.canvas.toDataURL()
  }
}

/**
 * 将 base64 数据转换为 Blob 对象
 * @param base64Data base64 编码的图片数据
 * @returns Blob 对象
 */
function base64ToBlob(base64Data: string): Blob {
  const parts = base64Data.split(',')
  const mimeMatch = parts[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/png'
  const bstr = atob(parts[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

/** 保存裁剪后的头像：上传至后端并自动保存到 profile */
async function saveCroppedAvatar(): Promise<void> {
  if (!croppedBase64.value) {
    ElMessage.warning('请先选择图片')
    return
  }

  try {
    // 将 base64 转为 Blob，再包装成 File 对象
    const blob = base64ToBlob(croppedBase64.value)
    const file = new File([blob], 'avatar.png', { type: blob.type })

    // 第一步：上传文件到服务器
    const uploadRes = await uploadImage(file)
    const url = uploadRes.data?.data?.url
    if (!url) {
      ElMessage.error('上传成功但未获取到图片路径')
      return
    }

    // 第二步：自动保存到 profile（参考 zstarbox：裁剪后直接持久化）
    const profileRes = await updateProfile({ avatar: url })
    if (profileRes.data?.data) userStore.setUser(profileRes.data.data)

    // 更新本地展示
    form.avatar = url
    avatarBase64.value = croppedBase64.value
    cropperVisible.value = false
    ElMessage.success('头像已更新')
  } catch (error: any) {
    console.error('头像上传失败:', error)
    ElMessage.error(error?.response?.data?.message || '头像上传失败')
  }
}

/**
 * 保存用户资料
 * 调用 PUT /api/auth/profile 接口更新昵称、邮箱、手机号、头像
 */
async function handleSave(): Promise<void> {
  saving.value = true
  try {
    const res = await updateProfile({
      nickname: form.nickname,
      email: form.email,
      phone: form.phone,
      avatar: form.avatar,
    })
    // 更新 store 中的用户信息
    if (res.data.data) userStore.setUser(res.data.data)
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  // 从 store 同步资料到表单
  const u = userStore.userInfo
  if (u) {
    Object.assign(form, {
      username: u.username || '',
      nickname: u.nickname || '',
      email: u.email || '',
      phone: u.phone || '',
      avatar: u.avatar || '',
    })
    avatarBase64.value = u.avatar || ''
  }
})
</script>

<style scoped>
.profile-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0 8px;
}

.avatar-wrap {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid var(--na-border-lighter);
}

.avatar {
  width: 100%;
  height: 100%;
}

.avatar-hover {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-wrap:hover .avatar-hover {
  opacity: 1;
}

.username {
  margin-top: 12px;
  font-size: 18px;
  font-weight: 600;
  color: var(--na-text-primary);
}

.account {
  font-size: 13px;
  color: var(--na-text-secondary);
  margin-top: 2px;
}

.role-tags {
  margin-top: 12px;
  text-align: center;
}

.dialog-footer-actions {
  display: inline-flex;
  gap: 8px;
}

.select-btn {
  position: relative;
}

.select-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.cropper-area {
  width: 100%;
  height: 400px;
}
</style>
