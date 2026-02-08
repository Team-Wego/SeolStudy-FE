<template>
  <div class="feedback-page">
    <h1 class="page-title">피드백</h1>

    <!-- 탭: 일간/주간/월간/플래너 -->
    <div class="tab-group">
      <button
        v-for="t in tabs"
        :key="t.value"
        class="tab-chip"
        :class="{ active: activeTab === t.value }"
        @click="changeTab(t.value)"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- 날짜 네비게이션 -->
    <div class="date-nav">
      <button class="nav-btn" @click="navigate(-1)">
        <ChevronLeft :size="20" />
      </button>
      <span class="nav-label">{{ navLabel }}</span>
      <button class="nav-btn" @click="navigate(1)">
        <ChevronRight :size="20" />
      </button>
    </div>

    <!-- ===== 일간 탭 ===== -->
    <template v-if="activeTab === 'daily'">
      <div class="week-grid">
        <div
          v-for="d in weekDays"
          :key="d.dateStr"
          class="week-cell"
          :class="{ selected: d.dateStr === selectedDate }"
          @click="selectDate(d.dateStr)"
        >
          <span class="week-day-label">{{ d.dayLabel }}</span>
          <span class="week-day-num">{{ d.day }}</span>
          <div
            v-if="dailyCounts[d.dateStr]"
            class="count-badge"
            :class="{ 'badge-active': d.dateStr === selectedDate }"
          >
            {{ dailyCounts[d.dateStr] }}개
          </div>
          <div v-else class="count-badge empty" />
        </div>
      </div>

      <!-- 과목 필터 -->
      <div class="filter-group">
        <button
          v-for="s in subjectFilters"
          :key="s.value"
          class="filter-chip"
          :class="{ active: selectedSubject === s.value }"
          @click="selectedSubject = s.value"
        >
          {{ s.label }}
        </button>
      </div>

      <!-- 피드백 카드 목록 -->
      <div v-if="loading" class="loading-text">불러오는 중...</div>
      <div v-else-if="filteredDailyFeedbacks.length === 0" class="empty-text">
        해당 날짜에 피드백이 없습니다
      </div>
      <div v-else class="feedback-list">
        <div
          v-for="fb in filteredDailyFeedbacks"
          :key="fb.feedbackId"
          class="feedback-card"
          @click="goToDetail(fb.feedbackId)"
        >
          <div class="card-top-row">
            <div class="card-top-left">
              <span v-if="fb.subject" class="subject-tag" :class="'tag-' + fb.subject">
                {{ subjectLabel(fb.subject) }}
              </span>
              <span class="card-chapter">{{ fb.taskTitle || (activeTab === 'planner' ? '플래너 피드백' : '일간 피드백') }}</span>
            </div>
            <span class="card-date">{{ fb.targetDate ? formatTargetDate(fb.targetDate) : formatDate(fb.createdAt) }}</span>
          </div>
          <div v-if="fb.taskTitle" class="card-subtitle">{{ fb.taskTitle }}</div>
          <p class="card-content">{{ fb.content }}</p>
        </div>
      </div>
    </template>

    <!-- ===== 주간 탭 ===== -->
    <template v-if="activeTab === 'weekly'">
      <div class="weekly-section">
        <template v-for="(row, rowIdx) in weeklyRows" :key="rowIdx">
          <div class="weekly-row-header">{{ row.label }}</div>
          <div class="weekly-row-grid">
            <div
              v-for="w in row.weeks"
              :key="w.idx"
              class="week-cell-box clickable"
              :class="{ 'week-box-selected': selectedWeekIdx === w.idx, 'week-box-has': w.hasFeedback }"
              @click="selectWeek(w.idx)"
            >
              <span class="week-box-label">{{ w.label }}</span>
              <span v-if="w.hasFeedback" class="week-box-dot" />
            </div>
          </div>
        </template>
      </div>

      <!-- 선택된 주의 WEEKLY 피드백 -->
      <template v-if="selectedWeekIdx !== null">
        <div v-if="!selectedWeeklyFeedback && !loading" class="empty-text">
          해당 주에 주간 피드백이 없습니다
        </div>
        <div v-else-if="selectedWeeklyFeedback" class="monthly-detail" @click="goToDetail(selectedWeeklyFeedback.feedbackId)">
          <div class="monthly-detail-header">
            <span class="monthly-detail-title">{{ selectedWeeklyLabel }}</span>
            <span class="monthly-detail-date">{{ selectedWeeklyDateRange }}</span>
          </div>
          <p class="monthly-detail-content">{{ selectedWeeklyFeedback.content }}</p>
        </div>
      </template>
      <div v-else-if="!loading" class="empty-text">주를 선택하세요</div>
    </template>

    <!-- ===== 월간 탭 ===== -->
    <template v-if="activeTab === 'monthly'">
      <div class="month-grid">
        <div
          v-for="(m, idx) in monthlyData"
          :key="idx"
          class="month-cell clickable"
          :class="{ 'month-selected': selectedMonthIdx === idx, 'month-has-feedback': m.hasFeedback }"
          @click="selectMonth(idx)"
        >
          <span class="month-label">{{ m.label }}</span>
          <span v-if="m.hasFeedback" class="month-dot" />
        </div>
      </div>

      <!-- 선택된 월의 MONTHLY 피드백 내용 -->
      <template v-if="selectedMonthIdx !== null">
        <div v-if="!selectedMonthlyFeedback && !loading" class="empty-text">
          해당 월에 월간 피드백이 없습니다
        </div>
        <div v-else-if="selectedMonthlyFeedback" class="monthly-detail" @click="goToDetail(selectedMonthlyFeedback.feedbackId)">
          <div class="monthly-detail-header">
            <span class="monthly-detail-title">{{ monthlyData[selectedMonthIdx].label }} 피드백</span>
            <span class="monthly-detail-date">{{ formatDate(selectedMonthlyFeedback.createdAt) }}</span>
          </div>
          <p class="monthly-detail-content">{{ selectedMonthlyFeedback.content }}</p>
        </div>
      </template>
      <div v-else-if="!loading" class="empty-text">월을 선택하세요</div>
    </template>

    <!-- ===== 플래너 탭 ===== -->
    <template v-if="activeTab === 'planner'">
      <div class="week-grid">
        <div
          v-for="d in weekDays"
          :key="d.dateStr"
          class="week-cell"
          :class="{ selected: d.dateStr === selectedDate }"
          @click="selectDate(d.dateStr)"
        >
          <span class="week-day-label">{{ d.dayLabel }}</span>
          <span class="week-day-num">{{ d.day }}</span>
          <div
            v-if="plannerCounts[d.dateStr]"
            class="count-badge"
            :class="{ 'badge-active': d.dateStr === selectedDate }"
          >
            {{ plannerCounts[d.dateStr] }}개
          </div>
          <div v-else class="count-badge empty" />
        </div>
      </div>

      <!-- 피드백 카드 목록 -->
      <div v-if="loading" class="loading-text">불러오는 중...</div>
      <div v-else-if="filteredPlannerFeedbacks.length === 0" class="empty-text">
        해당 날짜에 플래너 피드백이 없습니다
      </div>
      <div v-else class="feedback-list">
        <div
          v-for="fb in filteredPlannerFeedbacks"
          :key="fb.feedbackId"
          class="feedback-card"
          @click="goToDetail(fb.feedbackId)"
        >
          <div class="card-header">
            <span class="card-chapter">플래너 피드백</span>
            <span class="card-date">{{ fb.targetDate ? formatTargetDate(fb.targetDate) : formatDate(fb.createdAt) }}</span>
          </div>
          <p class="card-content">{{ fb.content }}</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { getCookie } from '@/utils/cookie'
import { getFeedbacks, getDailyFeedbackCount } from '@/api/feedback/feedbackApi'

const router = useRouter()
const loading = ref(false)

// ── 탭 ──
const tabs = [
  { label: '일간', value: 'daily' },
  { label: '주간', value: 'weekly' },
  { label: '월간', value: 'monthly' },
  { label: '플래너', value: 'planner' },
]
const activeTab = ref('daily')

// ── 과목 필터 (일간 전용) ──
const subjectFilters = [
  { label: '전체', value: 'ALL' },
  { label: '영어', value: 'ENG' },
  { label: '수학', value: 'MATH' },
  { label: '국어', value: 'KOR' },
]
const selectedSubject = ref('ALL')

function subjectLabel(s) {
  const map = { KOR: '국어', ENG: '영어', MATH: '수학', ETC: '기타' }
  return map[s] || s
}

// ── 날짜 상태 ──
const today = new Date()
const currentDate = ref(new Date(today))
const currentYear = ref(today.getFullYear())
const currentQuarter = ref(Math.floor(today.getMonth() / 3) + 1)

// ── 데이터 ──
const dailyCounts = ref({})
const plannerCounts = ref({})
const allFeedbacks = ref([])
const selectedDate = ref(formatDateStr(today))
const selectedWeekIdx = ref(null)
const selectedMonthIdx = ref(null)

function getMemberId() {
  return getCookie('memberId')
}

// ── 날짜 유틸 ──
function formatDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`
}

function formatTargetDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  return `${parts[0]}. ${parts[1]}. ${parts[2]}`
}

function getMonday(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

// ── 네비게이션 라벨 ──
const navLabel = computed(() => {
  if (activeTab.value === 'daily' || activeTab.value === 'planner') {
    const sel = new Date(selectedDate.value + 'T00:00:00')
    const y = sel.getFullYear()
    const m = sel.getMonth() + 1
    const d = sel.getDate()
    const weekday = ['일', '월', '화', '수', '목', '금', '토']
    const wd = weekday[sel.getDay()]
    return `${y}. ${m}. ${d} ${wd}`
  }
  if (activeTab.value === 'weekly') {
    return `${currentYear.value}년 ${currentQuarter.value}분기`
  }
  return `${currentYear.value}년`
})

// ── 네비게이션 ──
function navigate(dir) {
  if (activeTab.value === 'daily' || activeTab.value === 'planner') {
    const d = new Date(currentDate.value)
    d.setDate(d.getDate() + dir * 7)
    currentDate.value = d
  } else if (activeTab.value === 'weekly') {
    currentQuarter.value += dir
    if (currentQuarter.value > 4) {
      currentQuarter.value = 1
      currentYear.value++
    } else if (currentQuarter.value < 1) {
      currentQuarter.value = 4
      currentYear.value--
    }
  } else {
    currentYear.value += dir
  }
}

function changeTab(tab) {
  activeTab.value = tab
  selectedWeekIdx.value = null
  selectedMonthIdx.value = null
  allFeedbacks.value = []
}

// ── 일간/플래너 공용: 주간 캘린더 데이터 ──
const weekDays = computed(() => {
  const mon = getMonday(currentDate.value)
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    days.push({
      dateStr: formatDateStr(d),
      day: d.getDate(),
      dayLabel: DAY_LABELS[i],
    })
  }
  return days
})

function selectDate(dateStr) {
  selectedDate.value = dateStr
}

// ── 일간: 선택 날짜의 TASK 피드백 (과목 필터 적용) ──
const filteredDailyFeedbacks = computed(() => {
  const dateMatch = allFeedbacks.value.filter((fb) => {
    if (fb.feedbackType !== 'TASK') return false
    return fb.targetDate === selectedDate.value
  })
  if (selectedSubject.value === 'ALL') return dateMatch
  return dateMatch.filter((fb) => fb.subject === selectedSubject.value)
})

// ── 플래너: 선택 날짜의 PLANNER 피드백 ──
const filteredPlannerFeedbacks = computed(() => {
  return allFeedbacks.value.filter((fb) => {
    if (fb.feedbackType !== 'PLANNER') return false
    return fb.targetDate === selectedDate.value
  })
})

// ── 주간: 분기별 주 데이터 (유무만 체크) ──
const quarterWeeks = computed(() => {
  const qStart = new Date(currentYear.value, (currentQuarter.value - 1) * 3, 1)
  const qEnd = new Date(currentYear.value, currentQuarter.value * 3, 0)
  const weeks = []
  let mon = getMonday(qStart)

  while (mon <= qEnd) {
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    const label = `${mon.getMonth() + 1}.${mon.getDate()}~`
    const startStr = formatDateStr(mon)
    const endStr = formatDateStr(sun)
    const hasFeedback = allFeedbacks.value.some((fb) => {
      if (fb.feedbackType !== 'WEEKLY') return false
      return fb.targetDate >= startStr && fb.targetDate <= endStr
    })
    weeks.push({ label, hasFeedback, startDate: new Date(mon), endDate: new Date(sun) })
    mon = new Date(mon)
    mon.setDate(mon.getDate() + 7)
  }
  return weeks
})

// 주간: 5개씩 행 그룹 + 주차 라벨
const weeklyRows = computed(() => {
  const rows = []
  const all = quarterWeeks.value
  const perRow = 5
  for (let i = 0; i < all.length; i += perRow) {
    const chunk = all.slice(i, i + perRow).map((w, j) => ({ ...w, idx: i + j }))
    rows.push({
      label: `${i + 1}주차 ~ ${Math.min(i + perRow, all.length)}주차`,
      weeks: chunk,
    })
  }
  return rows
})

// 주간: 선택된 주의 WEEKLY 피드백 (1개)
const selectedWeeklyFeedback = computed(() => {
  if (selectedWeekIdx.value === null) return null
  const week = quarterWeeks.value[selectedWeekIdx.value]
  if (!week) return null
  const startStr = formatDateStr(week.startDate)
  const endStr = formatDateStr(week.endDate)
  return allFeedbacks.value.find((fb) => {
    if (fb.feedbackType !== 'WEEKLY') return false
    return fb.targetDate >= startStr && fb.targetDate <= endStr
  }) || null
})

// 주간: 선택된 주의 라벨
const selectedWeeklyLabel = computed(() => {
  if (selectedWeekIdx.value === null) return ''
  const week = quarterWeeks.value[selectedWeekIdx.value]
  if (!week) return ''
  const weekNum = Math.ceil(week.startDate.getDate() / 7)
  return `${week.startDate.getMonth() + 1}월 ${weekNum}주차 피드백`
})

// 주간: 선택된 주의 날짜 범위 텍스트
const selectedWeeklyDateRange = computed(() => {
  if (selectedWeekIdx.value === null) return ''
  const week = quarterWeeks.value[selectedWeekIdx.value]
  if (!week) return ''
  const s = week.startDate
  const e = week.endDate
  return `${s.getMonth() + 1}월 ${s.getDate()}일 ~ ${e.getMonth() + 1}월 ${e.getDate()}일`
})

function selectWeek(idx) {
  selectedWeekIdx.value = idx
}

// ── 월간: 12개월 데이터 (MONTHLY 타입, 유무만 체크) ──
const monthlyData = computed(() => {
  const months = []
  for (let m = 0; m < 12; m++) {
    const label = `${m + 1}월`
    const monthStr = String(m + 1).padStart(2, '0')
    const startStr = `${currentYear.value}-${monthStr}-01`
    const endDay = new Date(currentYear.value, m + 1, 0).getDate()
    const endStr = `${currentYear.value}-${monthStr}-${String(endDay).padStart(2, '0')}`
    const hasFeedback = allFeedbacks.value.some((fb) => {
      if (fb.feedbackType !== 'MONTHLY') return false
      return fb.targetDate >= startStr && fb.targetDate <= endStr
    })
    months.push({ label, hasFeedback, month: m })
  }
  return months
})

// 월간: 선택된 월의 MONTHLY 피드백 (1개)
const selectedMonthlyFeedback = computed(() => {
  if (selectedMonthIdx.value === null) return null
  const m = monthlyData.value[selectedMonthIdx.value]
  if (!m) return null
  const monthStr = String(m.month + 1).padStart(2, '0')
  const startStr = `${currentYear.value}-${monthStr}-01`
  const endDay = new Date(currentYear.value, m.month + 1, 0).getDate()
  const endStr = `${currentYear.value}-${monthStr}-${String(endDay).padStart(2, '0')}`
  return allFeedbacks.value.find((fb) => {
    if (fb.feedbackType !== 'MONTHLY') return false
    return fb.targetDate >= startStr && fb.targetDate <= endStr
  }) || null
})

function selectMonth(idx) {
  selectedMonthIdx.value = idx
}

// ── 데이터 로드 ──
async function loadData() {
  const memberId = getMemberId()
  if (!memberId) return
  loading.value = true

  try {
    if (activeTab.value === 'daily') {
      const mon = getMonday(currentDate.value)
      const sun = new Date(mon)
      sun.setDate(mon.getDate() + 6)
      const startDate = formatDateStr(mon)
      const endDate = formatDateStr(sun)

      const [countsRes, feedbacksRes] = await Promise.all([
        getDailyFeedbackCount(memberId, startDate, endDate),
        getFeedbacks(memberId, 'TASK'),
      ])

      const countMap = {}
      ;(countsRes.data || []).forEach((item) => {
        countMap[item.date] = item.count
      })
      dailyCounts.value = countMap
      allFeedbacks.value = feedbacksRes.data || []
    } else if (activeTab.value === 'planner') {
      const { data } = await getFeedbacks(memberId, 'PLANNER')
      allFeedbacks.value = data || []
      // 플래너 카운트: targetDate별 집계
      const countMap = {}
      allFeedbacks.value.forEach((fb) => {
        if (fb.targetDate) {
          countMap[fb.targetDate] = (countMap[fb.targetDate] || 0) + 1
        }
      })
      plannerCounts.value = countMap
    } else if (activeTab.value === 'weekly') {
      const { data } = await getFeedbacks(memberId, 'WEEKLY')
      allFeedbacks.value = data || []
    } else {
      const { data } = await getFeedbacks(memberId, 'MONTHLY')
      allFeedbacks.value = data || []
    }
  } catch (e) {
    console.error('[Feedback] 데이터 로드 실패:', e)
  } finally {
    loading.value = false
  }
}

// 상세 이동
function goToDetail(feedbackId) {
  router.push(`/mentee/feedback/${feedbackId}`)
}

// ── watchers ──
watch(activeTab, () => loadData())
watch(currentDate, () => {
  if (activeTab.value === 'daily' || activeTab.value === 'planner') loadData()
})
watch(currentYear, () => loadData())
watch(currentQuarter, () => { if (activeTab.value === 'weekly') loadData() })

onMounted(() => loadData())
</script>

<style scoped>
.feedback-page {
  padding: 0 20px 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  margin: 0 0 20px;
  color: #1a1a1a;
}

/* 탭 */
.tab-group {
  display: inline-flex;
  gap: 4px;
  margin-bottom: 24px;
  background: #f0f0f0;
  border-radius: 28px;
  padding: 4px;
}

.tab-chip {
  padding: 8px 18px;
  border-radius: 24px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #999;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-chip.active {
  background: #fff;
  color: #1a1a1a;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

/* 날짜 네비게이션 */
.date-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #333;
  display: flex;
}

.nav-label {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.3px;
}

/* 주간 캘린더 (일간/플래너) */
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin-bottom: 20px;
}

.week-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 8px 0;
  border-radius: 12px;
  transition: background 0.15s;
}

.week-cell.selected {
  background: #f0f4f8;
}

.week-day-label {
  font-size: 13px;
  color: #aaa;
  font-weight: 500;
}

.week-day-num {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}

/* 카운트 뱃지 */
.count-badge {
  min-width: 40px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #4AF38A;
  color: #1a1a1a;
  font-size: 12px;
  font-weight: 700;
}

.count-badge.empty {
  background: #f0f0f0;
  min-width: 40px;
}

.count-badge.badge-active {
  background: #3ad67a;
  color: #fff;
}

/* 과목 필터 */
.filter-group {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 8px 20px;
  border-radius: 24px;
  border: 1.5px solid #ddd;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  color: #aaa;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-chip.active {
  background: #42a5f5;
  color: #fff;
  border-color: #42a5f5;
}

/* 피드백 카드 */
.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feedback-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: box-shadow 0.15s;
}

.feedback-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.card-top-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subject-tag {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}

.tag-ENG { background: #43a047; }
.tag-MATH { background: #1e88e5; }
.tag-KOR { background: #fb8c00; }
.tag-ETC { background: #9e9e9e; }

.card-chapter {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.card-date {
  font-size: 13px;
  color: #bbb;
  flex-shrink: 0;
}

.card-subtitle {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 6px 0 0;
}

.card-content {
  font-size: 14px;
  color: #666;
  line-height: 1.7;
  margin: 10px 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 주간 그리드 (dot 스타일) */
.weekly-section {
  margin-bottom: 24px;
}

.weekly-row-header {
  font-size: 13px;
  font-weight: 600;
  color: #aaa;
  margin: 14px 0 8px;
}

.weekly-row-header:first-child {
  margin-top: 0;
}

.weekly-row-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.week-cell-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 4px;
  border-radius: 14px;
  background: #f5f5f5;
  transition: all 0.15s;
}

.week-cell-box.clickable {
  cursor: pointer;
}

.week-cell-box.clickable:hover {
  background: #ebebeb;
}

.week-cell-box.week-box-has {
  background: #4AF38A;
}

.week-cell-box.week-box-selected {
  background: #222;
}

.week-cell-box.week-box-selected .week-box-label {
  color: #fff;
}

.week-box-label {
  font-size: 13px;
  color: #555;
  font-weight: 600;
  text-align: center;
}

.week-box-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #1a1a1a;
}

.week-cell-box.week-box-selected .week-box-dot {
  background: #fff;
}

/* 월간 그리드 */
.month-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 24px;
}

.month-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: 14px;
  background: #f5f5f5;
  transition: all 0.15s;
  position: relative;
}

.month-cell.clickable {
  cursor: pointer;
}

.month-cell.clickable:hover {
  background: #ebebeb;
}

.month-cell.month-has-feedback {
  background: #4AF38A;
}

.month-cell.month-selected {
  background: #222;
}

.month-cell.month-selected .month-label {
  color: #fff;
}

.month-label {
  font-size: 14px;
  color: #555;
  font-weight: 600;
}

.month-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #1a1a1a;
}

.month-cell.month-selected .month-dot {
  background: #fff;
}

/* 주간/월간 피드백 상세 (공용) */
.monthly-detail {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: box-shadow 0.15s;
}

.monthly-detail:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.monthly-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.monthly-detail-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.monthly-detail-date {
  font-size: 13px;
  color: #bbb;
}

.monthly-detail-content {
  font-size: 14px;
  color: #555;
  line-height: 1.8;
  margin: 0;
  white-space: pre-wrap;
}

/* 공통 */
.loading-text,
.empty-text {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 40px 0;
}
</style>
