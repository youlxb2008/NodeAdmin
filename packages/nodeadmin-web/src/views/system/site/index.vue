<!--
  站点设置
  --------
  管理平台标题、登录页背景图、布局宽度等全局配置的动态配置。
  配置存储在 options 表（key=site_config）。
  支持选择预设背景图或上传自定义图片。
-->
<template>
  <div>
    <!-- 页面标题栏 -->
    <PageHeader title="站点设置" />

    <div class="site-settings-container">
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
        style="max-width: 700px"
      >
        <!-- 平台标题 -->
        <el-form-item label="平台标题" prop="title">
          <el-input
            v-model="form.title"
            maxlength="50"
            show-word-limit
            placeholder="管理后台显示名称（如 NodeAdmin）"
          />
        </el-form-item>

        <!-- 布局宽度 -->
        <el-form-item label="布局宽度">
          <el-radio-group v-model="form.layoutWidth">
            <el-radio-button label="default">默认（宽版）</el-radio-button>
            <el-radio-button label="compact">紧凑（窄版）</el-radio-button>
          </el-radio-group>
          <div class="layout-hint">
            切换后保存并刷新页面生效。默认：顶部 70px + 侧边栏 250px；紧凑：顶部 50px + 侧边栏 160px。
          </div>
        </el-form-item>

        <!-- 登录页背景图 -->
        <el-form-item label="登录页背景图">
          <!-- 预设背景图选择区域 -->
          <div class="preset-bg-section">
            <div class="preset-bg-grid">
              <div
                v-for="bg in presetBackgrounds"
                :key="bg.url"
                class="preset-bg-item"
                :class="{ active: form.loginBg === bg.url }"
                :title="bg.label"
                @click="selectPresetBg(bg.url)"
              >
                <img :src="bg.url" :alt="bg.label" class="preset-bg-thumb" />
                <div class="preset-bg-label">{{ bg.label }}</div>
                <!-- 选中标识 -->
                <div v-if="form.loginBg === bg.url" class="preset-bg-check">
                  <el-icon><Check /></el-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- 分隔线 -->
          <el-divider content-position="left">或上传自定义图片</el-divider>

          <!-- 当前选中预览 + 操作区 -->
          <div v-if="form.loginBg" class="login-bg-preview">
            <el-image
              :src="resolveBgUrl(form.loginBg)"
              fit="cover"
              style="width: 320px; height: 180px; border-radius: 8px"
            />
            <div style="margin-top: 8px; display: flex; gap: 8px">
              <el-button type="danger" text size="small" @click="removeBg">
                移除背景图
              </el-button>
            </div>
          </div>

          <!-- 上传按钮 -->
          <el-upload
            class="upload-component"
            :action="uploadAction"
            :headers="uploadHeaders"
            name="file"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :on-success="onUploadSuccess"
            :on-error="onUploadError"
            accept="image/jpeg,image/png,image/webp,image/gif"
          >
            <el-button type="primary" plain>选择图片上传</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 jpg/png/webp/gif，最大 5MB</div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- 保存按钮 -->
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存设置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 站点设置页面
 *
 * 功能：
 * 1. 修改平台标题（同步更新浏览器标签、登录页标题、Header logo 文字）
 * 2. 切换布局宽度（default=默认，compact=紧凑）
 * 3. 从预设背景图中选择（带缩略图预览）
 * 4. 上传自定义背景图
 * 5. 移除背景图
 */
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { getAdminSite, updateSite } from '@/api/site'
import { useSiteStore } from '@/store/site'

defineOptions({ name: 'system-site' })

/** 站点配置 store（保存后同步更新，让 header / login 立即生效） */
const siteStore = useSiteStore()

/** 表单引用 */
const formRef = ref<FormInstance>()
/** 保存中状态 */
const saving = ref(false)

/** 表单数据 */
const form = reactive({
  /** 平台标题 */
  title: '',
  /** 登录页背景图路径（预设路径或上传后的相对路径） */
  loginBg: '',
  /** 布局宽度模式 */
  layoutWidth: 'default' as 'default' | 'compact',
})

/** 表单校验规则 */
const formRules: FormRules = {
  title: [
    { required: true, message: '平台标题不能为空', trigger: 'blur' },
    { min: 1, max: 50, message: '标题长度 1-50 个字符', trigger: 'blur' },
  ],
}

/** 上传接口地址（后端 POST /api/admin/upload/login-bg） */
const uploadAction = '/api/admin/upload/login-bg'
/** 上传请求头（axios 默认携带 cookie，此处留空即可） */
const uploadHeaders = {}

/**
 * 预设背景图列表
 *
 * 图片存放在 public/login-bg/ 目录下，通过 Vite 静态服务直接访问。
 * 路径以 /admin/ 开头是因为 Vite 配置了 base='/admin/'。
 */
const presetBackgrounds = [
  { label: '科技蓝', url: '/admin/login-bg/bg-01-tech-blue_001.jpg' },
  { label: '紫韵流光', url: '/admin/login-bg/bg-02-purple-wave_001.jpg' },
  { label: '暗金商务', url: '/admin/login-bg/bg-03-dark-gold_001.jpg' },
  { label: '赛博网格', url: '/admin/login-bg/bg-04-cyber-grid_001.jpg' },
  { label: '翡翠幽光', url: '/admin/login-bg/bg-05-emerald_001.jpg' },
  { label: '星空深邃', url: '/admin/login-bg/bg-06-starry_001.jpg' },
]

/**
 * 选择预设背景图
 * @param url 预设图片路径
 */
function selectPresetBg(url: string): void {
  // 再次点击取消选择
  form.loginBg = form.loginBg === url ? '' : url
}

/**
 * 将相对路径背景图转为完整 URL
 * @param relativePath 如 /uploads/login-bg/xxx.png 或 /admin/login-bg/xxx.jpg
 * @returns 可直接用于 img src 的完整 URL
 */
function resolveBgUrl(relativePath: string): string {
  if (!relativePath) return ''
  // 预设图以 /admin/ 开头，是 Vite 静态资源，直接返回
  if (relativePath.startsWith('/admin/')) return relativePath
  // 如果已经是完整 URL 则直接返回
  if (relativePath.startsWith('http')) return relativePath
  // 上传的图片需要拼接 API base URL
  const baseURL = import.meta.env.VITE_API_BASE_URL || ''
  return `${baseURL}${relativePath}`
}

/**
 * 上传前校验：检查文件类型和大小
 * @param file 待上传的文件
 * @returns true 允许上传，false 拦截
 */
function beforeUpload(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('仅支持 jpg/png/webp/gif 格式')
    return false
  }
  // 限制最大 5MB
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

/**
 * 上传成功回调
 * @param response 接口返回 { code: 0, data: { url: string } }
 */
function onUploadSuccess(response: { code: number; data: { url: string } }): void {
  if (response?.data?.url) {
    // 将返回的相对路径保存到表单
    form.loginBg = response.data.url
    ElMessage.success('背景图上传成功')
  }
}

/** 上传失败回调：提示用户 */
function onUploadError(): void {
  ElMessage.error('背景图上传失败')
}

/** 移除背景图：清空表单字段 */
function removeBg(): void {
  form.loginBg = ''
}

/**
 * 保存设置
 * 1. 表单校验
 * 2. 调用管理端更新接口
 * 3. 同步更新 store（让 header / login 立即生效）
 */
async function handleSave(): Promise<void> {
  if (!formRef.value) return
  // 表单校验
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    await updateSite({ title: form.title, loginBg: form.loginBg, layoutWidth: form.layoutWidth })
    // 同步更新 store（让 header / login 立即生效）
    siteStore.setSite({ title: form.title, loginBg: form.loginBg, layoutWidth: form.layoutWidth })
    ElMessage.success('站点设置已保存')
  } catch (err: unknown) {
    // 提取后端返回的错误消息
    const msg =
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '保存失败'
    ElMessage.error(msg)
  } finally {
    saving.value = false
  }
}

/**
 * 页面加载时获取当前配置
 * 成功后填充表单，失败则提示错误
 */
onMounted(async () => {
  try {
    const res = await getAdminSite()
    const data = res.data?.data
    if (data) {
      form.title = data.title || ''
      form.loginBg = data.loginBg || ''
      form.layoutWidth = data.layoutWidth || 'default'
    }
  } catch {
    ElMessage.error('加载站点配置失败')
  }
})
</script>

<style scoped>
/* 设置表单容器 */
.site-settings-container {
  padding: 20px;
  background: var(--na-bg-container);
  border-radius: 8px;
}

/* 布局宽度提示文字 */
.layout-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--na-text-secondary);
  line-height: 1.5;
}

/* 背景图预览区域（纵向排列：图片 + 操作按钮） */
.login-bg-preview {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 16px;
}

/* 预设背景图选择区域 */
.preset-bg-section {
  width: 100%;
}

/* 预设背景图网格：3 列布局 */
.preset-bg-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 560px;
}

/* 单个预设背景图卡片 */
.preset-bg-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  aspect-ratio: 16 / 9;
}

/* 悬浮效果 */
.preset-bg-item:hover {
  border-color: var(--el-color-primary-light-5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 选中效果 */
.preset-bg-item.active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

/* 缩略图 */
.preset-bg-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 标签文字 */
.preset-bg-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px 8px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  color: #fff;
  font-size: 12px;
  text-align: center;
}

/* 选中勾号 */
.preset-bg-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

/* 上传组件：增加顶部和左侧间距 */
.upload-component {
  margin-top: 12px;
  margin-left: 16px;
}
</style>
