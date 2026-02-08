<template>
  <div class="flex flex-col h-full bg-white">
    <!-- 헤더 -->
    <div class="shrink-0" style="padding: 16px 20px;">
      <div class="flex items-center justify-between">
        <div class="flex items-center" style="gap: 6px;">
          <button @click="navigatePrev">
            <ChevronLeft :size="22" color="#333" />
          </button>
          <span class="font-bold" style="font-size: 20px;">
            {{ headerText }}
          </span>
          <button @click="navigateNext">
            <ChevronRight :size="22" color="#333" />
          </button>
        </div>
        <!-- 주간/월간 토글 -->
        <div class="flex rounded-full" style="padding: 3px; background: #F3F4F6;">
          <button class="font-medium rounded-full transition-colors" :style="{
            padding: '6px 14px',
            fontSize: '13px',
            background: viewMode === 'weekly' ? 'white' : 'transparent',
            color: viewMode === 'weekly' ? '#333' : '#8E8E93',
            boxShadow: viewMode === 'weekly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }" @click="switchMode('weekly')">
            주간
          </button>
          <button class="font-medium rounded-full transition-colors" :style="{
            padding: '6px 14px',
            fontSize: '13px',
            background: viewMode === 'monthly' ? 'white' : 'transparent',
            color: viewMode === 'monthly' ? '#333' : '#8E8E93',
            boxShadow: viewMode === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }" @click="switchMode('monthly')">
            월간
          </button>
        </div>
      </div>
    </div>

    <!-- 요일 라벨 -->
    <div class="shrink-0 grid grid-cols-7 text-center" style="padding: 0 20px; margin-bottom: 8px;">
      <span v-for="label in dayLabels" :key="label" class="text-[#8E8E93]" style="font-size: 13px;">
        {{ label }}
      </span>
    </div>

    <!-- 주간 뷰 -->
    <div v-if="viewMode === 'weekly'" class="shrink-0 grid grid-cols-7 text-center" style="padding: 0 20px 16px;">
      <div v-for="d in weekDates" :key="d.toISOString()" class="flex flex-col items-center">
        <button class="flex items-center justify-center rounded-full transition-colors" :style="{
          width: '36px',
          height: '36px',
          fontSize: '15px',
          fontWeight: filteredDate && isSameDate(d, filteredDate) ? '700' : '400',
          background: filteredDate && isSameDate(d, filteredDate) ? '#4AF38A'
            : !filteredDate ? '#F3F4F6'
              : 'white',
          color: filteredDate && isSameDate(d, filteredDate) ? 'white' : '#333',
        }" @click="selectDate(d)">
          {{ d.getDate() }}
        </button>
        <div :style="{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          marginTop: '4px',
          background: hasTaskOn(d) ? '#4AF38A' : 'transparent',
        }" />
      </div>
    </div>

    <!-- 월간 뷰 -->
    <div v-if="viewMode === 'monthly'" class="shrink-0" style="padding: 0 20px 16px;">
      <div class="grid grid-cols-7 text-center" style="row-gap: 2px;">
        <div v-for="(d, idx) in monthDates" :key="idx" class="flex flex-col items-center">
          <button class="flex items-center justify-center rounded-full transition-colors" :style="{
            width: '36px',
            height: '36px',
            fontSize: '14px',
            fontWeight: d && filteredDate && isSameDate(d, filteredDate) ? '700' : '400',
            background: d && filteredDate && isSameDate(d, filteredDate) ? '#4AF38A'
              : d && !filteredDate && d.getMonth() === currentMonth ? '#F3F4F6'
                : 'transparent',
            color: !d ? 'transparent'
              : filteredDate && isSameDate(d, filteredDate) ? 'white'
                : d.getMonth() !== currentMonth ? '#D1D1D6'
                  : '#333',
          }" :disabled="!d" @click="d && selectDate(d)">
            {{ d ? d.getDate() : '' }}
          </button>
          <div :style="{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            marginTop: '2px',
            background: d && hasTaskOn(d) ? '#4AF38A' : 'transparent',
          }" />
        </div>
      </div>
    </div>

    <!-- 할일 섹션 헤딩 -->
    <div class="shrink-0 flex items-center justify-between" style="padding: 0 20px; margin-bottom: 12px;">
      <span class="font-semibold" style="font-size: 15px; color: #333;">
        {{ filteredDate ? '일간 할 일'
          : viewMode === 'weekly' ? '주간 할 일' : '월간 할 일'
        }}
      </span>
      <button v-if="filteredDate" class="text-[#0CA5FE] font-medium" style="font-size: 13px;" @click="showAll">
        {{ viewMode === 'weekly' ? '주간 전체 보기' : '월간 전체 보기' }}
      </button>
    </div>

    <!-- 할일 목록 -->
    <div class="flex-1 overflow-y-auto" style="padding: 0 20px 20px;">
      <!-- 특정 날짜 필터 (filteredDailyTasks — goalName 포함) -->
      <template v-if="filteredDate">
        <p class="font-semibold text-[#8E8E93]" style="font-size: 13px; margin-bottom: 8px;">
          {{ filteredDate.getMonth() + 1 }}월 {{ filteredDate.getDate() }}일 {{ korDayNames[filteredDate.getDay()] }}요일
        </p>
        <div v-if="filteredDailyTasks.length > 0" class="rounded-2xl" style="padding: 5px 15px; background: #F3F4F6;">
          <div v-for="(task, idx) in filteredDailyTasks" :key="task.id">
            <div class="flex items-center" style="padding: 16px 0;">
              <div class="flex-1 min-w-0">
                <p class="font-semibold" style="font-size: 15px; margin-bottom: 6px;">{{ task.title }}</p>
                <div class="flex items-center gap-2">
                  <SubjectTag :subject="subjectMap[task.subject] || 'korean'" size="sm" />
                  <span v-if="task.goalName" class="text-[#5A5A5A] truncate" style="font-size: 13px;">
                    {{ task.goalName }}
                  </span>
                </div>
              </div>
              <span class="shrink-0 font-medium rounded-full" :style="{
                padding: '6px 14px',
                fontSize: '12px',
                background: task.isChecked ? '#4AF38A' : '#E0F2E9',
                color: task.isChecked ? 'white' : '#9CC5A8',
              }">
                {{ task.isChecked ? '완료' : '미완료' }}
              </span>
            </div>
            <div v-if="idx < filteredDailyTasks.length - 1" style="border-top: 1px solid #E5E5EA;" />
          </div>
        </div>
        <div v-else-if="!loading" class="flex flex-col items-center justify-center" style="padding-top: 80px;">
          <p class="text-[#8E8E93]" style="font-size: 14px;">등록된 할 일이 없습니다.</p>
        </div>
      </template>

      <!-- 전체 보기 (rangeTasks 날짜별 그룹핑) -->
      <template v-else>
        <template v-if="groupedTasks.length > 0">
          <div v-for="group in groupedTasks" :key="group.dateStr" style="margin-bottom: 12px;">
            <p class="font-semibold text-[#8E8E93]" style="font-size: 13px; margin-bottom: 8px;">
              {{ group.label }}
            </p>
            <div class="rounded-2xl" style="padding: 8px 20px; background: #F3F4F6;">
              <div v-for="(task, idx) in group.tasks" :key="task.id">
                <div class="flex items-center" style="padding: 16px 0;">
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold" style="font-size: 15px; margin-bottom: 6px;">{{ task.title }}</p>
                    <div class="flex items-center gap-2">
                      <SubjectTag :subject="subjectMap[task.subject] || 'korean'" size="sm" />
                      <span v-if="task.goalName" class="text-[#5A5A5A] truncate" style="font-size: 13px;">
                        {{ task.goalName }}
                      </span>
                    </div>
                  </div>
                  <span class="shrink-0 font-medium rounded-full" :style="{
                    padding: '6px 14px',
                    fontSize: '12px',
                    background: task.isChecked ? '#4AF38A' : '#E0F2E9',
                    color: task.isChecked ? 'white' : '#9CC5A8',
                  }">
                    {{ task.isChecked ? '완료' : '미완료' }}
                  </span>
                </div>
                <div v-if="idx < group.tasks.length - 1" style="border-top: 1px solid #E5E5EA;" />
              </div>
            </div>
          </div>
        </template>
        <div v-else-if="!loading" class="flex flex-col items-center justify-center" style="padding-top: 80px;">
          <p class="text-[#8E8E93]" style="font-size: 14px;">
            {{ viewMode === 'weekly' ? '이번 주' : '이번 달' }} 등록된 할 일이 없습니다.
          </p>
        </div>
      </template>
    </div>

    <!-- FAB: 할 일 추가 -->
    <button
      class="fixed z-30 flex items-center justify-center rounded-full bg-[#0CA5FE] shadow-lg transition-transform active:scale-95"
      style="width: 52px; height: 52px; right: 20px; bottom: 100px;" @click="goToCreateTask">
      <Plus :size="24" color="white" :stroke-width="2.5" />
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-vue-next'
import SubjectTag from '@/components/common/SubjectTag.vue'
import { getCookie } from '@/utils/cookie'
import { getWeeklyTasks } from '@/api/task/taskApi'

const router = useRouter()

const viewMode = ref('weekly')
const selectedDate = ref(new Date())
const filteredDate = ref(null)
const rangeTasks = ref([])
const loading = ref(false)

const subjectMap = {
  KOR: 'korean',
  ENG: 'english',
  MATH: 'math',
}

const dayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const korDayNames = ['일', '월', '화', '수', '목', '금', '토']

// 헤더 텍스트
const headerText = computed(() => {
  const d = selectedDate.value
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  if (viewMode.value === 'weekly') {
    const mon = weekDates.value[0]
    const sun = weekDates.value[6]
    return `${y}. ${mon.getMonth() + 1}.${mon.getDate()} ~ ${sun.getMonth() + 1}.${sun.getDate()}`
  }
  return `${y}. ${m}`
})

const currentMonth = computed(() => selectedDate.value.getMonth())

// 주간 날짜 배열 (월요일 시작)
const weekDates = computed(() => {
  const d = new Date(selectedDate.value)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(d)
  monday.setDate(d.getDate() - diff)

  const dates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    dates.push(date)
  }
  return dates
})

// 월간 날짜 배열 (월요일 시작)
const monthDates = computed(() => {
  const d = selectedDate.value
  const year = d.getFullYear()
  const month = d.getMonth()

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

// 현재 뷰 범위의 시작/끝 날짜 (문자열로 반환하여 불필요한 재호출 방지)
const dateRange = computed(() => {
  if (viewMode.value === 'weekly') {
    const dates = weekDates.value
    return { start: formatDate(dates[0]), end: formatDate(dates[6]) }
  } else {
    const dates = monthDates.value
    return { start: formatDate(dates[0]), end: formatDate(dates[dates.length - 1]) }
  }
})

// 할일 있는 날짜 Set (YYYY-MM-DD)
const taskDateSet = computed(() => {
  const set = new Set()
  for (const task of rangeTasks.value) {
    set.add(task.date)
  }
  return set
})

function hasTaskOn(d) {
  return taskDateSet.value.has(formatDate(d))
}

// 선택된 날짜의 할일 (rangeTasks에서 클라이언트 필터링 — API 호출 없이 즉시 렌더링)
const filteredDailyTasks = computed(() => {
  if (!filteredDate.value) return []
  const dateStr = formatDate(filteredDate.value)
  return rangeTasks.value.filter(task => task.date === dateStr)
})

// 날짜별 그룹핑
const groupedTasks = computed(() => {
  const groups = {}
  for (const task of rangeTasks.value) {
    const dateStr = task.date
    if (!groups[dateStr]) groups[dateStr] = []
    groups[dateStr].push(task)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateStr, tasks]) => {
      const [, m, d] = dateStr.split('-').map(Number)
      const dateObj = new Date(dateStr + 'T00:00:00')
      const dayName = korDayNames[dateObj.getDay()]
      return { dateStr, label: `${m}월 ${d}일 ${dayName}요일`, tasks }
    })
})

function isSameDate(a, b) {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function selectDate(d) {
  const newDate = new Date(d)
  filteredDate.value = newDate
  selectedDate.value = newDate
}

function showAll() {
  filteredDate.value = null
}

function switchMode(mode) {
  if (viewMode.value === mode) return
  viewMode.value = mode
  filteredDate.value = null
}

function navigatePrev() {
  const d = new Date(selectedDate.value)
  if (viewMode.value === 'weekly') {
    d.setDate(d.getDate() - 7)
  } else {
    d.setMonth(d.getMonth() - 1)
  }
  selectedDate.value = d
  filteredDate.value = null
}

function navigateNext() {
  const d = new Date(selectedDate.value)
  if (viewMode.value === 'weekly') {
    d.setDate(d.getDate() + 7)
  } else {
    d.setMonth(d.getMonth() + 1)
  }
  selectedDate.value = d
  filteredDate.value = null
}

async function fetchRangeTasks() {
  const menteeId = getCookie('memberId')
  const { start, end } = dateRange.value
  try {
    const { data } = await getWeeklyTasks(Number(menteeId), start, end)
    rangeTasks.value = data
  } catch (e) {
    console.error('범위 할일 조회 실패:', e)
  }
}

async function fetchDailyTasks() {
  if (!filteredDate.value) return
  loading.value = true
  filteredDailyTasks.value = []
  const menteeId = getCookie('memberId')
  try {
    const { data } = await getDailyTasks(Number(menteeId), formatDate(filteredDate.value))
    filteredDailyTasks.value = data
  } catch (e) {
    console.error('일별 할일 조회 실패:', e)
  } finally {
    loading.value = false
  }
}

async function fetchAll() {
  loading.value = true
  await Promise.all([fetchRangeTasks(), fetchDailyTasks()])
  loading.value = false
}

// 필터 날짜 변경 → daily 재조회
watch(filteredDate, () => {
  if (filteredDate.value) {
    fetchDailyTasks()
  }
})

// 범위 변경 → range 재조회 (문자열 비교로 같은 주/월이면 재호출 안 함)
watch(() => `${dateRange.value.start}_${dateRange.value.end}`, () => {
  fetchRangeTasks()
})

function goToCreateTask() {
  const date = filteredDate.value ? formatDate(filteredDate.value) : formatDate(new Date())
  router.push({ path: '/mentee/tasks/create', query: { date } })
}

onMounted(() => {
  fetchAll()
})
</script>
