<template>
  <div class="subject-detail-page">
    <!-- Header -->
    <div class="header">
      <button class="back-btn" @click="router.back()">
        <ChevronLeft :size="24" color="#1A1A1A" />
      </button>
      <h1 class="header-title">{{ subjectNameMap[subject] || subject }}</h1>
      <div class="header-spacer" />
    </div>

    <!-- Skeleton Loading -->
    <template v-if="loading">
      <div class="task-summary">
        <div class="skeleton skeleton-text" style="width: 160px; height: 18px;" />
      </div>
      <div class="task-list">
        <div v-for="i in 4" :key="i" class="task-card">
          <div class="task-card-left">
            <div class="task-info">
              <div class="skeleton skeleton-text" style="width: 140px; height: 14px;" />
              <div class="skeleton skeleton-text" style="width: 90px; height: 14px;" />
            </div>
          </div>
          <div class="skeleton" style="width: 60px; height: 28px; border-radius: 50px;" />
        </div>
      </div>
    </template>

    <!-- Actual Content -->
    <template v-else>
      <!-- Task Count -->
      <div class="task-summary">
        <span>{{ periodLabel }} 필수 과제 목록</span>
        <span class="task-count">{{ taskList.length }}개</span>
      </div>

      <!-- Task List -->
      <div class="task-list">
        <div v-for="task in taskList" :key="task.id" class="task-card">
          <div class="task-card-left">
            <div class="task-info">
              <span class="task-title">{{ task.title }}</span>
              <span class="task-date">{{ formatTaskDate(task.date) }}</span>
            </div>
          </div>
          <StatusBadge :type="task.isChecked ? 'complete' : 'incomplete'" size="md" />
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="taskList.length === 0" class="empty-state">
        <p>과제가 없습니다.</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import { getCookie } from '@/utils/cookie'
import { getTasks } from '@/api/task/taskApi'
import StatusBadge from '@/components/common/StatusBadge.vue'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  getDay,
} from 'date-fns'

const router = useRouter()
const route = useRoute()
const subject = route.params.subject
const mode = route.query.mode || 'weekly'

const loading = ref(true)
const taskList = ref([])

const subjectNameMap = {
  KOR: '국어',
  ENG: '영어',
  MATH: '수학',
  ETC: '기타',
}

const periodLabel = computed(() => {
  return mode === 'monthly' ? '이번 달' : '이번 주'
})

const dayNames = ['일', '월', '화', '수', '목', '금', '토']

function formatTaskDate(dateStr) {
  const date = parseISO(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayName = dayNames[getDay(date)]
  return `${month}.${String(day).padStart(2, '0')} (${dayName})`
}

async function fetchTasks() {
  try {
    const memberId = getCookie('memberId')
    if (!memberId) return

    const today = new Date()
    let startDate, endDate

    // query param에서 날짜를 받거나, mode에 따라 계산
    if (route.query.startDate && route.query.endDate) {
      startDate = route.query.startDate
      endDate = route.query.endDate
    } else if (mode === 'monthly') {
      startDate = format(startOfMonth(today), 'yyyy-MM-dd')
      endDate = format(endOfMonth(today), 'yyyy-MM-dd')
    } else {
      startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      endDate = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    }

    const res = await getTasks(memberId, startDate, endDate)

    // 해당 과목만 필터링
    taskList.value = res.data.filter((task) => task.subject === subject)
  } catch (e) {
    console.error('Failed to fetch tasks:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTasks()
})
</script>

<style scoped>
.subject-detail-page {
  padding: 16px 20px 40px;
  background: #F5F5F5;
  min-height: 100%;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: #1A1A1A;
}

.header-spacer {
  width: 24px;
}

/* Task Summary */
.task-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 700;
  color: #1A1A1A;
}

.task-count {
  color: #0CA5FE;
}

/* Task List */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 28px;
  padding: 24px;
}

.task-card-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.task-left-bar {
  width: 4px;
  height: 36px;
  background: #EBEBEB;
  border-radius: 2px;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.task-title {
  font-size: 14px;
  font-weight: 700;
  color: black;
}

.task-date {
  font-size: 14px;
  font-weight: 600;
  color: #8E8E93;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #A6A6A6;
  font-size: 14px;
}

/* Skeleton Loading */
.skeleton {
  background: #E8E8E8;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%);
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton-text {
  border-radius: 6px;
}
</style>
