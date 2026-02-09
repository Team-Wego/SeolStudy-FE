<template>
  <div class="monthly-schedule">
    <!-- 상단: 캘린더 + 과제 등록 -->
    <div class="calendar-header">
      <div class="month-nav">
        <button class="nav-btn" @click="navigateMonth(-1)">
          <ChevronLeft :size="20" color="#333" />
        </button>
        <span class="month-title">{{ currentMonth + 1 }}월</span>
        <button class="nav-btn" @click="navigateMonth(1)">
          <ChevronRight :size="20" color="#333" />
        </button>
      </div>
      <button class="add-task-btn" @click="openTaskModal">
        + 과제 등록하기
      </button>
    </div>

    <!-- 캘린더 그리드 -->
    <div class="calendar-card">
      <div class="day-labels">
        <span v-for="label in dayLabels" :key="label" class="day-label">{{ label }}</span>
      </div>
      <div class="calendar-grid">
        <div
          v-for="(d, idx) in monthDates"
          :key="idx"
          class="calendar-cell"
          :class="{
            'other-month': d && d.getMonth() !== currentMonth,
            'selected': d && selectedDate && isSameDate(d, selectedDate),
            'has-task': d && hasTaskOn(d),
          }"
          @click="d && selectDate(d)"
        >
          <span v-if="d" class="cell-date">{{ d.getDate() }}</span>
        </div>
      </div>
    </div>

    <!-- 선택된 날짜의 과제/피드백 -->
    <div v-if="selectedDate" class="selected-date-info">
      <h4 class="selected-date-title">
        {{ selectedDate.getMonth() + 1 }}월 {{ selectedDate.getDate() }}일 과제
      </h4>
      <div v-if="selectedDateTasks.length === 0" class="empty-text">
        등록된 과제가 없습니다.
      </div>
      <div v-for="task in selectedDateTasks" :key="task.id" class="date-task-item">
        <SubjectTag
          v-if="subjectTagMap[task.subject]"
          :subject="subjectTagMap[task.subject]"
          size="sm"
        />
        <span class="date-task-title">{{ task.title }}</span>
        <StatusBadge :type="task.isChecked ? 'complete' : 'incomplete'" size="sm" />
      </div>
    </div>

    <!-- 주간 피드백 -->
    <div class="section-card">
      <h3 class="section-title">주간피드백 📂</h3>

      <!-- 주차 탭 -->
      <div class="week-tabs">
        <button
          v-for="(week, idx) in weeks"
          :key="idx"
          class="week-tab"
          :class="{ active: activeWeekIdx === idx }"
          @click="activeWeekIdx = idx"
        >
          <span class="week-tab-label">{{ currentMonth + 1 }}월 {{ idx + 1 }}주차</span>
          <span class="week-tab-range">({{ week.rangeLabel }})</span>
        </button>
      </div>

      <!-- 주간 피드백 내용 -->
      <div v-if="weeks.length > 0" class="weekly-feedback-area">
        <div v-if="activeWeekFeedback" class="existing-feedback">
          <p>{{ activeWeekFeedback.content }}</p>
        </div>
        <textarea
          v-model="weeklyFeedbackText"
          class="feedback-textarea"
          :placeholder="activeWeekFeedbackPlaceholder"
        />
        <button
          class="feedback-submit-btn"
          :disabled="!weeklyFeedbackText.trim() || weeklySubmitting"
          @click="handleWeeklyFeedback"
        >
          {{ weeklySubmitting ? '등록 중...' : '등록하기' }}
        </button>
      </div>
    </div>

    <!-- 월간 피드백 -->
    <div class="section-card">
      <h3 class="section-title">월간 피드백 🎯</h3>

      <div v-if="monthlyFeedback" class="existing-feedback">
        <p>{{ monthlyFeedback.content }}</p>
      </div>
      <textarea
        v-model="monthlyFeedbackText"
        class="feedback-textarea"
        placeholder="이번 달 학생의 전반적인 성취도와 다음 달 방향성을 작성해주세요."
      />
      <button
        class="feedback-submit-btn"
        :disabled="!monthlyFeedbackText.trim() || monthlySubmitting"
        @click="handleMonthlyFeedback"
      >
        {{ monthlySubmitting ? '등록 중...' : '등록하기' }}
      </button>
    </div>

    <!-- 과제 등록 모달 -->
    <TaskCreateModal
      v-if="showTaskModal"
      :mentee-id="menteeId"
      :date="taskModalDate"
      @close="showTaskModal = false"
      @created="handleTaskCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import SubjectTag from '@/components/common/SubjectTag.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import TaskCreateModal from './TaskCreateModal.vue'
import { getWeeklyTasks } from '@/api/task/taskApi'
import { getFeedbacks, createFeedback } from '@/api/feedback/feedbackApi'

const props = defineProps({
  menteeId: { type: [Number, String], required: true },
})

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())
const selectedDate = ref(null)
const activeWeekIdx = ref(0)

const rangeTasks = ref([])
const weeklyFeedbacks = ref([])
const monthlyFeedback = ref(null)

const weeklyFeedbackText = ref('')
const weeklySubmitting = ref(false)
const monthlyFeedbackText = ref('')
const monthlySubmitting = ref(false)

const showTaskModal = ref(false)
const taskModalDate = ref('')

const dayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const subjectTagMap = { KOR: 'korean', ENG: 'english', MATH: 'math' }

// 월간 날짜 배열 (월요일 시작)
const monthDates = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const dates = []
  for (let i = startOffset - 1; i >= 0; i--) {
    dates.push(new Date(year, month, -i))
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(year, month, i))
  }
  const remaining = 7 - (dates.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      dates.push(new Date(year, month + 1, i))
    }
  }
  return dates
})

// 월 범위
const monthRange = computed(() => {
  const dates = monthDates.value
  if (dates.length === 0) return { start: '', end: '' }
  return {
    start: formatDate(dates[0]),
    end: formatDate(dates[dates.length - 1]),
  }
})

// 주차 계산
const weeks = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const result = []
  let weekStart = new Date(firstDay)

  // 첫 주 시작을 월요일로 맞추기
  const day = weekStart.getDay()
  if (day !== 1) {
    // 이미 1일부터 시작하므로 그대로
  }

  while (weekStart <= lastDay) {
    // 주 끝: 일요일 또는 월말
    const weekEnd = new Date(weekStart)
    const daysToSunday = 7 - (weekEnd.getDay() === 0 ? 7 : weekEnd.getDay())
    weekEnd.setDate(weekEnd.getDate() + daysToSunday)
    if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime())

    const startStr = `${String(weekStart.getMonth() + 1).padStart(2, '0')}.${String(weekStart.getDate()).padStart(2, '0')}`
    const endStr = `${String(weekEnd.getMonth() + 1).padStart(2, '0')}.${String(weekEnd.getDate()).padStart(2, '0')}`

    result.push({
      start: formatDate(weekStart),
      end: formatDate(weekEnd),
      rangeLabel: `${startStr} ~ ${endStr}`,
    })

    // 다음 주 월요일
    const next = new Date(weekEnd)
    next.setDate(next.getDate() + 1)
    weekStart = next
  }

  return result
})

// 태스크 날짜 Set
const taskDateSet = computed(() => {
  const set = new Set()
  for (const task of rangeTasks.value) {
    set.add(task.date)
  }
  return set
})

// 선택된 날짜의 태스크
const selectedDateTasks = computed(() => {
  if (!selectedDate.value) return []
  const dateStr = formatDate(selectedDate.value)
  return rangeTasks.value.filter((t) => t.date === dateStr)
})

// 활성 주차의 기존 피드백
const activeWeekFeedback = computed(() => {
  if (weeks.value.length === 0) return null
  const week = weeks.value[activeWeekIdx.value]
  return weeklyFeedbacks.value.find((f) => {
    const fDate = f.createdAt?.substring(0, 10)
    return fDate >= week.start && fDate <= week.end
  }) || null
})

const activeWeekFeedbackPlaceholder = computed(() => {
  if (weeks.value.length === 0) return ''
  const week = weeks.value[activeWeekIdx.value]
  return `${currentMonth.value + 1}월 ${activeWeekIdx.value + 1}주차 (${week.rangeLabel}) 피드백을 작성하세요.\n학생이 수행한 ${activeWeekIdx.value + 1}주차 학습에 대한 코멘트...`
})

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isSameDate(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function hasTaskOn(d) {
  return taskDateSet.value.has(formatDate(d))
}

function selectDate(d) {
  selectedDate.value = new Date(d)
}

function navigateMonth(offset) {
  const d = new Date(currentYear.value, currentMonth.value + offset, 1)
  currentYear.value = d.getFullYear()
  currentMonth.value = d.getMonth()
  selectedDate.value = null
  activeWeekIdx.value = 0
}

function openTaskModal() {
  taskModalDate.value = selectedDate.value ? formatDate(selectedDate.value) : formatDate(new Date())
  showTaskModal.value = true
}

function handleTaskCreated() {
  showTaskModal.value = false
  fetchRangeTasks()
}

async function handleWeeklyFeedback() {
  if (!weeklyFeedbackText.value.trim() || weeklySubmitting.value) return
  const week = weeks.value[activeWeekIdx.value]
  if (!week) return

  weeklySubmitting.value = true
  try {
    await createFeedback({
      menteeId: Number(props.menteeId),
      type: 'WEEKLY',
      content: weeklyFeedbackText.value.trim(),
      targetDate: week.start,
    })
    weeklyFeedbackText.value = ''
    await fetchFeedbacks()
  } catch (e) {
    console.error('주간 피드백 등록 실패:', e)
  } finally {
    weeklySubmitting.value = false
  }
}

async function handleMonthlyFeedback() {
  if (!monthlyFeedbackText.value.trim() || monthlySubmitting.value) return

  monthlySubmitting.value = true
  try {
    const year = currentYear.value
    const month = currentMonth.value
    await createFeedback({
      menteeId: Number(props.menteeId),
      type: 'MONTHLY',
      content: monthlyFeedbackText.value.trim(),
      targetDate: `${year}-${String(month + 1).padStart(2, '0')}-01`,
    })
    monthlyFeedbackText.value = ''
    await fetchFeedbacks()
  } catch (e) {
    console.error('월간 피드백 등록 실패:', e)
  } finally {
    monthlySubmitting.value = false
  }
}

async function fetchRangeTasks() {
  try {
    const { start, end } = monthRange.value
    if (!start || !end) return
    const { data } = await getWeeklyTasks(Number(props.menteeId), start, end)
    rangeTasks.value = data || []
  } catch (e) {
    console.error('월간 태스크 조회 실패:', e)
  }
}

async function fetchFeedbacks() {
  try {
    const menteeId = Number(props.menteeId)
    const [weeklyRes, monthlyRes] = await Promise.all([
      getFeedbacks(menteeId, 'WEEKLY').catch(() => ({ data: [] })),
      getFeedbacks(menteeId, 'MONTHLY').catch(() => ({ data: [] })),
    ])
    weeklyFeedbacks.value = weeklyRes.data || []

    const monthlyList = monthlyRes.data || []
    const year = currentYear.value
    const month = currentMonth.value
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
    monthlyFeedback.value = monthlyList.find((f) => f.createdAt?.startsWith(monthStr)) || null
  } catch (e) {
    console.error('피드백 조회 실패:', e)
  }
}

watch(() => `${currentYear.value}-${currentMonth.value}`, () => {
  fetchRangeTasks()
  fetchFeedbacks()
  weeklyFeedbackText.value = ''
  monthlyFeedbackText.value = ''
})

onMounted(() => {
  fetchRangeTasks()
  fetchFeedbacks()
})
</script>

<style scoped>
.monthly-schedule {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 캘린더 헤더 */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.month-title {
  font-size: 20px;
  font-weight: 800;
}

.add-task-btn {
  padding: 10px 20px;
  border-radius: 12px;
  border: none;
  background: #333;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

/* 캘린더 카드 */
.calendar-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.day-labels {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 8px;
}

.day-label {
  font-size: 13px;
  color: #8e8e93;
  font-weight: 500;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.15s;
}

.calendar-cell:hover {
  background: #f3f4f6;
}

.calendar-cell.other-month .cell-date {
  color: #d1d1d6;
}

.calendar-cell.selected {
  background: #4af38a;
}

.calendar-cell.selected .cell-date {
  color: #fff;
  font-weight: 700;
}

.calendar-cell.has-task .cell-date {
  position: relative;
}

.cell-date {
  font-size: 14px;
  color: #333;
}

/* 선택된 날짜 정보 */
.selected-date-info {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.selected-date-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 12px;
  color: #1a1a1a;
}

.date-task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}

.date-task-item:last-child {
  border-bottom: none;
}

.date-task-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 섹션 카드 */
.section-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 16px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0 0 16px;
}

/* 주차 탭 */
.week-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.week-tab {
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid #e5e5ea;
  background: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: all 0.15s;
}

.week-tab.active {
  background: #333;
  border-color: #333;
}

.week-tab.active .week-tab-label,
.week-tab.active .week-tab-range {
  color: #fff;
}

.week-tab-label {
  font-size: 13px;
  font-weight: 700;
  color: #333;
}

.week-tab-range {
  font-size: 11px;
  color: #8e8e93;
}

/* 피드백 영역 */
.weekly-feedback-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.existing-feedback {
  background: #f6f7f9;
  border-radius: 12px;
  padding: 16px;
}

.existing-feedback p {
  font-size: 14px;
  color: #3d3d3d;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}

.feedback-textarea {
  width: 100%;
  min-height: 100px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #ebebeb;
  background: #fff;
  font-size: 13px;
  line-height: 1.6;
  outline: none;
  resize: none;
  color: #333;
}

.feedback-textarea::placeholder {
  color: #bbb;
}

.feedback-submit-btn {
  align-self: flex-end;
  padding: 10px 24px;
  border-radius: 10px;
  border: none;
  background: #333;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.feedback-submit-btn:disabled {
  background: #d1d1d6;
  cursor: not-allowed;
}

/* 공통 */
.empty-text {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 20px 0;
}
</style>
