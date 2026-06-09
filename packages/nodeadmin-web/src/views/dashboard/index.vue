<!--
  Dashboard 首页
  ----------------
  - 4 张统计卡（用户 / 角色 / 菜单 / 字典数）
  - 2 张 ECharts 图表（用户注册柱状图 + 访问量折线图，mock 数据）
  - 主题切换、窗口 resize 时图表自适应
-->
<template>
  <div class="dashboard">
    <!-- 顶部 4 张统计卡 -->
    <el-row :gutter="20" class="stat-row">
      <el-col v-for="card in statCards" :key="card.key" :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" :body-style="{ padding: 0 }">
          <div class="stat-card" :style="{ background: card.gradient }">
            <div class="stat-icon">
              <Icon :icon="card.icon" />
            </div>
            <div class="stat-content">
              <div class="stat-num">{{ statsValue(card.key) }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 两张图表 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <span>最近 7 天用户注册</span>
          </template>
          <div ref="barChartRef" class="chart-box" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <span>最近 7 天访问量</span>
          </template>
          <div ref="lineChartRef" class="chart-box" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Icon } from '@iconify/vue'
import { getDashboardStats, type DashboardStats } from '../../api/dashboard'

// keep-alive 需要 name 标识
defineOptions({ name: 'dashboard' })

/**
 * 统计卡配置
 * 与后端 stats 字段一一对应
 */
const statCards = [
  {
    key: 'userCount' as const,
    label: '用户总数',
    icon: 'ph:user',
    gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
  },
  {
    key: 'roleCount' as const,
    label: '角色总数',
    icon: 'ph:identification-card',
    gradient: 'linear-gradient(135deg, #10b981, #14b8a6)',
  },
  {
    key: 'menuCount' as const,
    label: '菜单总数',
    icon: 'ph:tree-structure',
    gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
  },
  {
    key: 'dictCount' as const,
    label: '字典总数',
    icon: 'ph:book-open',
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
  },
]

/** 后端返回的统计数据 */
const stats = reactive<DashboardStats>({
  userCount: 0,
  roleCount: 0,
  menuCount: 0,
  dictCount: 0,
})

/**
 * 安全读取统计字段
 * @param key DashboardStats 字段名
 */
function statsValue(key: keyof DashboardStats): number {
  return stats[key] ?? 0
}

// ECharts DOM 与实例
const barChartRef = ref<HTMLDivElement>()
const lineChartRef = ref<HTMLDivElement>()
let barChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null

/** 最近 7 天 X 轴文案（简化为「周一 ~ 周日」） */
const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

/** 用户注册数 mock */
const registerMock = [3, 5, 8, 4, 12, 7, 9]
/** 访问量 mock */
const visitMock = [120, 220, 150, 80, 70, 110, 130]

/**
 * 根据当前主题获取图表通用文字颜色
 */
function getThemeTextColor(): string {
  return '#374151'
}

/** 柱状图 option */
function buildBarOption(): echarts.EChartsCoreOption {
  const color = getThemeTextColor()
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: weekDays,
      axisLabel: { color },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color },
    },
    series: [
      {
        name: '新用户',
        type: 'bar',
        data: registerMock,
        itemStyle: { color: '#6366f1', borderRadius: [4, 4, 0, 0] },
      },
    ],
  }
}

/** 折线图 option */
function buildLineOption(): echarts.EChartsCoreOption {
  const color = getThemeTextColor()
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: weekDays,
      axisLabel: { color },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color },
    },
    series: [
      {
        name: '访问量',
        type: 'line',
        smooth: true,
        data: visitMock,
        itemStyle: { color: '#10b981' },
        areaStyle: { color: 'rgba(16, 185, 129, 0.2)' },
      },
    ],
  }
}

/**
 * 加载后端统计数据
 * 失败时静默保留 0，不影响首页其他内容渲染
 */
async function loadStats(): Promise<void> {
  try {
    const res = await getDashboardStats()
    const data = res.data?.data
    if (data) Object.assign(stats, data)
  } catch (err) {
    // 仅做日志输出，避免登录后首页弹错误吐司
    console.warn('[dashboard] 加载统计数据失败', err)
  }
}

/** resize 处理函数 —— 提升为命名函数便于解绑 */
function handleResize(): void {
  barChart?.resize()
  lineChart?.resize()
}

/**
 * 初始化两张图表
 * 必须在 nextTick 后调用，确保 ref 已挂载
 */
function initCharts(): void {
  if (barChartRef.value) {
    barChart = echarts.init(barChartRef.value)
    barChart.setOption(buildBarOption())
  }
  if (lineChartRef.value) {
    lineChart = echarts.init(lineChartRef.value)
    lineChart.setOption(buildLineOption())
  }
}

onMounted(async () => {
  await nextTick()
  initCharts()
  window.addEventListener('resize', handleResize)
  loadStats()
})

onBeforeUnmount(() => {
  // 清理监听 + 销毁图表实例，避免内存泄漏
  window.removeEventListener('resize', handleResize)
  barChart?.dispose()
  lineChart?.dispose()
})
</script>

<style scoped>
.dashboard {
  padding: 4px;
}

.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  height: 110px;
  padding: 0 20px;
  color: #fff;
  border-radius: 4px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-box {
  width: 100%;
  height: 320px;
}
</style>
