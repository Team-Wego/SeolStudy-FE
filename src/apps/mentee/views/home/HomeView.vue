<template>
  <div class="home-page">
    <!-- Date Header -->
    <div class="date-header">
      <button class="date-nav-btn" @click="changeDate(-1)">
        <ChevronLeft :size="20" color="#1A1A1A" />
      </button>
      <h1 class="date-title">{{ formattedDate }}</h1>
      <button class="date-nav-btn" @click="changeDate(1)">
        <ChevronRight :size="20" color="#1A1A1A" />
      </button>
    </div>

    <!-- Mentor Comment Card -->
    <template v-if="loading">
      <div class="comment-card">
        <div class="skeleton skeleton-text" style="width: 100px; height: 20px; margin-bottom: 12px;" />
        <div class="skeleton skeleton-text" style="width: 100%; height: 16px; margin-bottom: 8px;" />
        <div class="skeleton skeleton-text" style="width: 70%; height: 16px;" />
      </div>
    </template>
    <template v-else>
      <div class="comment-card" :class="{ 'has-stamp': plannerComment?.completedAt }">
        <template v-if="plannerComment">
          <span class="comment-badge"> <img :src="star" alt="star" />오늘의 코멘트!</span>
          <!-- 마감 스탬프 (코멘트 카드 우측 상단에 걸쳐서 배치) -->
          <img v-if="plannerComment.completedAt" :src="stampImg" alt="마감 스탬프" class="stamp-img" />
          <div class="comment-content" :class="{ clickable: isCommentTruncated || commentExpanded }"
            @click="toggleComment">
            <p ref="commentTextRef" class="comment-text" :class="{ expanded: commentExpanded }">
              {{ plannerComment.comment }}
            </p>
            <div class="comment-footer">
              <span v-if="isCommentTruncated && !commentExpanded" class="comment-hint">더보기</span>
              <span v-if="commentExpanded" class="comment-hint">접기</span>
              <button class="comment-edit-icon" @click.stop="openCommentEdit">
                <Edit3 :size="14" color="#8E8E93" />
              </button>
            </div>
          </div>
        </template>
        <template v-else>
          <button class="comment-add-btn" @click="openCommentCreate">
            + 코멘트를 등록해보세요
          </button>
        </template>
      </div>
    </template>

    <!-- 플래너 마감 버튼 영역 -->
    <div v-if="!loading && plannerComment && !plannerComment.completedAt" class="complete-row">
      <button class="complete-btn" @click="showCompleteConfirm = true">
        마감하기
      </button>
    </div>

    <!-- 플래너 마감 확인 모달 -->
    <Transition name="overlay">
      <div v-if="showCompleteConfirm" class="menu-overlay" @click="showCompleteConfirm = false" />
    </Transition>
    <Transition name="popup">
      <div v-if="showCompleteConfirm" class="fab-menu confirm-modal">
        <p class="confirm-text">오늘의 플래너를 마감하시겠습니까?</p>
        <div class="time-modal-actions">
          <button class="time-modal-cancel" @click="showCompleteConfirm = false">취소</button>
          <button class="time-modal-submit" :class="{ disabled: completeSubmitting }"
            :disabled="completeSubmitting" @click="handleComplete">
            {{ completeSubmitting ? '처리 중...' : '마감' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- 코멘트 등록/수정 모달 오버레이 -->
    <Transition name="overlay">
      <div v-if="showCommentModal" class="menu-overlay" @click="closeCommentModal" />
    </Transition>
    <Transition name="popup">
      <div v-if="showCommentModal" class="fab-menu comment-modal">
        <h2 class="time-modal-title">{{ commentEditMode ? '코멘트 수정' : '코멘트 등록' }}</h2>
        <textarea v-model="commentText" placeholder="오늘의 코멘트를 입력하세요" class="comment-textarea" />
        <div class="time-modal-actions">
          <button class="time-modal-cancel" @click="closeCommentModal">취소</button>
          <button class="time-modal-submit" :class="{ disabled: !commentText.trim() || commentSubmitting }"
            :disabled="!commentText.trim() || commentSubmitting" @click="handleCommentSubmit">
            {{ commentSubmitting ? '저장 중...' : (commentEditMode ? '수정' : '등록') }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Toggle Row (한 줄 차지) -->
    <div class="toggle-row">
      <button class="toggle-timetable-btn" @click="showTimetable = !showTimetable">
        <ChevronsRight v-if="showTimetable" :size="18" color="#C2C2C2" />
        <ChevronsLeft v-else :size="18" color="#C2C2C2" />
      </button>
    </div>

    <!-- Planner Content -->
    <div class="planner-content">
      <!-- Task List Side -->
      <div class="task-side" :class="{ 'full-width': !showTimetable }">
        <!-- Skeleton Loading -->
        <template v-if="loading">
          <div class="task-section">
            <div class="skeleton skeleton-text" style="width: 60px; height: 28px; border-radius: 50px; margin-bottom: 12px;" />
            <div v-for="i in 3" :key="'skel-a-'+i" class="task-item">
              <div class="skeleton" style="width: 24px; height: 24px; border-radius: 4px; flex-shrink: 0;" />
              <div class="task-info">
                <div class="skeleton skeleton-text" style="width: 120px; height: 14px;" />
                <div class="skeleton skeleton-text" style="width: 60px; height: 12px;" />
              </div>
            </div>
          </div>
          <div class="task-section">
            <div class="skeleton skeleton-text" style="width: 60px; height: 28px; border-radius: 50px; margin-bottom: 12px;" />
            <div v-for="i in 2" :key="'skel-b-'+i" class="task-item">
              <div class="skeleton" style="width: 24px; height: 24px; border-radius: 4px; flex-shrink: 0;" />
              <div class="task-info">
                <div class="skeleton skeleton-text" style="width: 100px; height: 14px;" />
                <div class="skeleton skeleton-text" style="width: 50px; height: 12px;" />
              </div>
            </div>
          </div>
        </template>

        <!-- Actual Content -->
        <template v-else>
          <!-- Assignment Tasks (필수과제) -->
          <div v-if="assignmentTasks.length > 0" class="task-section">
            <span class="task-section-label">필수과제</span>
            <div class="task-list">
              <div v-for="task in assignmentTasks" :key="task.id" class="task-item" @click="goToTaskDetail(task.id)">
                <button class="task-checkbox" :class="{ checked: task.isChecked }" @click.stop="toggleTask(task)">
                  <Check v-if="task.isChecked" :size="18" color="#fff" :stroke-width="3" />
                </button>
                <div class="task-info">
                  <span class="task-title" :class="{ 'task-checked': task.isChecked }">{{ task.title }}</span>
                  <div class="task-tags">
                    <SubjectTag v-if="subjectTagMap[task.subject]" :subject="subjectTagMap[task.subject]" size="sm" />
                    <span v-else class="subject-tag tag-ETC">{{ subjectNameMap[task.subject] || task.subject }}</span>
                    <span v-if="task.goalName" class="goal-tag">{{ task.goalName }}</span>
                  </div>
                </div>
                <span v-if="!showTimetable && task.totalMinutes" class="task-time">
                  {{ formatMinutes(task.totalMinutes) }}
                </span>
                <ChevronRight v-if="!showTimetable" :size="16" color="#C2C2C2" class="task-chevron" />
              </div>
            </div>
          </div>

          <!-- Todo Tasks (자율과제) -->
          <div v-if="todoTasks.length > 0" class="task-section">
            <span class="task-section-label">자율과제</span>
            <div class="task-list">
              <div v-for="task in todoTasks" :key="task.id" class="task-item" @click="goToTaskDetail(task.id)">
                <button class="task-checkbox" :class="{ checked: task.isChecked }" @click.stop="toggleTask(task)">
                  <Check v-if="task.isChecked" :size="18" color="#fff" :stroke-width="3" />
                </button>
                <div class="task-info">
                  <span class="task-title" :class="{ 'task-checked': task.isChecked }">{{ task.title }}</span>
                  <div class="task-tags">
                    <SubjectTag v-if="subjectTagMap[task.subject]" :subject="subjectTagMap[task.subject]" size="sm" />
                    <span v-else class="subject-tag tag-ETC">{{ subjectNameMap[task.subject] || task.subject }}</span>
                    <span v-if="task.goalName" class="goal-tag">{{ task.goalName }}</span>
                  </div>
                </div>
                <span v-if="!showTimetable && task.totalMinutes" class="task-time">
                  {{ formatMinutes(task.totalMinutes) }}
                </span>
                <ChevronRight v-if="!showTimetable" :size="16" color="#C2C2C2" class="task-chevron" />
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="assignmentTasks.length === 0 && todoTasks.length === 0" class="empty-state">
            <p>오늘 등록된 과제가 없습니다.</p>
          </div>
        </template>
      </div>

      <!-- Timetable Side (6열 격자 + 형광펜 블록) -->
      <div v-if="showTimetable" class="timetable-side">
        <!-- Timetable Skeleton -->
        <template v-if="loading">
          <div class="timetable">
            <div v-for="hour in timeSlots" :key="'skel-t-'+hour" class="time-row" :class="{ 'last-row': hour === 23 }">
              <span class="time-label">{{ hour }}</span>
              <div class="time-grid">
                <div v-for="cell in 6" :key="cell" class="time-grid-cell" />
              </div>
            </div>
            <div class="time-row time-row-label-only">
              <span class="time-label">24</span>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="timetable">
            <div v-for="hour in timeSlots" :key="hour" class="time-row" :class="{ 'last-row': hour === 23 }">
              <span class="time-label">{{ hour }}</span>
              <div class="time-grid">
                <div v-for="cell in 6" :key="cell" class="time-grid-cell" />
                <!-- 이 행에 해당하는 형광펜 블록들 -->
                <div v-for="(block, idx) in getRowBlocks(hour)" :key="idx" class="study-block"
                  :class="[`block-${block.subject}`]" :style="block.style" />
              </div>
            </div>
            <!-- 24시 라벨만 표시 -->
            <div class="time-row time-row-label-only">
              <span class="time-label">24</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Overlay -->
    <Transition name="overlay">
      <div v-if="showMenu" class="menu-overlay" @click="showMenu = false" />
    </Transition>

    <!-- FAB Popup Menu -->
    <Transition name="popup">
      <div v-if="showMenu" class="fab-menu">
        <button class="fab-menu-item" @click="goToTaskCreate">
          <Edit3 :size="16" color="#333" />
          할 일 추가
        </button>
        <div class="fab-menu-divider" />
        <button class="fab-menu-item" @click="openTimeModal">
          <Clock :size="16" color="#333" />
          공부 기록 추가
        </button>
      </div>
    </Transition>

    <!-- 시간 추가 모달 오버레이 -->
    <Transition name="overlay">
      <div v-if="showTimeModal" class="menu-overlay" @click="closeTimeModal" />
    </Transition>

    <!-- 시간 추가 모달 -->
    <Transition name="popup">
      <div v-if="showTimeModal" class="fab-menu time-modal">
        <h2 class="time-modal-title">공부 기록 추가</h2>

        <!-- 할 일 선택 -->
        <div class="time-modal-field">
          <label class="time-modal-label">할 일 선택</label>
          <select v-model="timeForm.taskId" class="time-modal-select">
            <option :value="null" disabled>할 일을 선택해주세요</option>
            <option v-for="task in allTasks" :key="task.id" :value="task.id">{{ task.title }}</option>
          </select>
        </div>

        <!-- 시작 시간 -->
        <div class="time-modal-field">
          <label class="time-modal-label">시작</label>
          <div class="time-input-row">
            <div class="period-toggle">
              <button class="period-btn" :class="{ active: timeForm.startPeriod === '오전' }"
                @click="timeForm.startPeriod = '오전'">오전</button>
              <button class="period-btn" :class="{ active: timeForm.startPeriod === '오후' }"
                @click="timeForm.startPeriod = '오후'">오후</button>
            </div>
            <input v-model="timeForm.startHour" type="number" min="1" max="12" placeholder="시" class="time-input" />
            <span class="time-colon">:</span>
            <input v-model="timeForm.startMinute" type="number" min="0" max="59" placeholder="분" class="time-input" />
          </div>
        </div>

        <!-- 종료 시간 -->
        <div class="time-modal-field">
          <label class="time-modal-label">종료</label>
          <div class="time-input-row">
            <div class="period-toggle">
              <button class="period-btn" :class="{ active: timeForm.endPeriod === '오전' }"
                @click="timeForm.endPeriod = '오전'">오전</button>
              <button class="period-btn" :class="{ active: timeForm.endPeriod === '오후' }"
                @click="timeForm.endPeriod = '오후'">오후</button>
            </div>
            <input v-model="timeForm.endHour" type="number" min="1" max="12" placeholder="시" class="time-input" />
            <span class="time-colon">:</span>
            <input v-model="timeForm.endMinute" type="number" min="0" max="59" placeholder="분" class="time-input" />
          </div>
        </div>

        <!-- 에러 메시지 -->
        <p v-if="timeError" class="time-modal-error">{{ timeError }}</p>

        <!-- 버튼 영역 -->
        <div class="time-modal-actions">
          <button class="time-modal-cancel" @click="closeTimeModal">취소</button>
          <button class="time-modal-submit" :class="{ disabled: !isTimeFormValid || timeSubmitting }"
            :disabled="!isTimeFormValid || timeSubmitting" @click="handleTimeSubmit">
            {{ timeSubmitting ? '등록 중...' : '추가' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- FAB Button -->
    <button class="fab-btn" @click="showMenu = !showMenu">
      <Plus :size="24" color="white" :stroke-width="2.5" />
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft, ChevronRight, ChevronsRight, ChevronsLeft, Plus, Check, Edit3, Clock } from 'lucide-vue-next'
import SubjectTag from '@/components/common/SubjectTag.vue'
import { getCookie } from '@/utils/cookie'
import { getDailyTasks, getPlannerComment, getStudyTime, updateTaskStatus, createStudyTime, getDailyStudyTimes, createPlannerComment, updatePlannerComment, deletePlannerComment, completePlanner } from '@/api/task/taskApi'
import { format, addDays, getDay } from 'date-fns'
import star from '@/assets/icons/star.svg'
import stampImg from '@/assets/images/stamp.png'

const router = useRouter()
const route = useRoute()

// 알림 등에서 ?date=YYYY-MM-DD 쿼리로 특정 날짜 플래너 이동 지원
const initialDate = route.query.date ? new Date(route.query.date + 'T00:00:00') : new Date()
const currentDate = ref(initialDate)
const loading = ref(true)
const showTimetable = ref(true)
const showMenu = ref(false)
const commentExpanded = ref(false)
const commentTextRef = ref(null)
const isCommentTruncated = ref(false)

const tasks = ref([])
const plannerComment = ref(null)
const studyTimes = ref([])

const dayNames = ['일', '월', '화', '수', '목', '금', '토']
const timeSlots = Array.from({ length: 18 }, (_, i) => i + 6) // 6~23 (6:00~24:00 커버)

const subjectNameMap = {
  KOR: '국어',
  ENG: '영어',
  MATH: '수학',
  ETC: '기타',
}

// API subject code → SubjectTag prop 매핑
const subjectTagMap = {
  ENG: 'english',
  MATH: 'math',
  KOR: 'korean',
}

const formattedDate = computed(() => {
  const d = currentDate.value
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const date = d.getDate()
  const dayName = dayNames[getDay(d)]
  return `${year}. ${month}. ${date} ${dayName}`
})

const dateParam = computed(() => format(currentDate.value, 'yyyy-MM-dd'))

const assignmentTasks = computed(() =>
  tasks.value.filter((t) => t.type === 'ASSIGNMENT').sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
)

const todoTasks = computed(() =>
  tasks.value.filter((t) => t.type === 'TODO').sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
)

function toggleComment() {
  if (isCommentTruncated.value || commentExpanded.value) {
    commentExpanded.value = !commentExpanded.value
  }
}

function changeDate(offset) {
  currentDate.value = addDays(currentDate.value, offset)
  commentExpanded.value = false
}

function formatMinutes(min) {
  if (!min) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0 && m > 0) return `${h}:${String(m).padStart(2, '0')}:00`
  if (h > 0) return `${h}:00:00`
  return `0:${String(m).padStart(2, '0')}:00`
}

// 특정 시간(hour) 행에 해당하는 형광펜 블록 반환
// 6열 = 각 열 10분, left/right를 %로 계산
function getRowBlocks(hour) {
  const blocks = []

  studyTimes.value.forEach((st) => {
    const start = new Date(st.startedAt)
    const end = new Date(st.endedAt)
    const startH = start.getHours()
    const startM = start.getMinutes()
    const endH = end.getHours()
    const endM = end.getMinutes()

    // 이 행(hour)과 겹치는 부분 계산
    // 이 행의 범위: hour시 0분 ~ hour시 60분
    const rowStart = 0
    const rowEnd = 60

    // 이 studyTime이 이 행에서 차지하는 분 범위
    const blockStart = startH < hour ? rowStart : startH === hour ? startM : 60
    const blockEnd = endH > hour ? rowEnd : endH === hour ? endM : 0

    if (blockStart >= blockEnd) return // 이 행에 겹치지 않음

    // left/right를 %로 계산 (60분 = 100%)
    const leftPercent = (blockStart / 60) * 100
    const rightPercent = ((60 - blockEnd) / 60) * 100

    blocks.push({
      subject: st.subject || 'ETC',
      style: {
        left: `${leftPercent}%`,
        right: `${rightPercent}%`,
      },
    })
  })

  return blocks
}

async function toggleTask(task) {
  try {
    const memberId = getCookie('memberId')
    if (!memberId) return
    await updateTaskStatus(memberId, task.id, !task.isChecked)
    task.isChecked = !task.isChecked
  } catch (e) {
    console.error('Failed to toggle task:', e)
  }
}

function goToTaskCreate() {
  showMenu.value = false
  router.push('/mentee/tasks/create')
}

function goToTaskDetail(taskId) {
  router.push(`/mentee/tasks/${taskId}`)
}

// ─── 공부 기록 추가 모달 ───
const showTimeModal = ref(false)
const timeSubmitting = ref(false)
const timeError = ref('')

const timeForm = reactive({
  taskId: null,
  startPeriod: '오전',
  startHour: '',
  startMinute: '',
  endPeriod: '오전',
  endHour: '',
  endMinute: '',
})

const allTasks = computed(() => [...assignmentTasks.value, ...todoTasks.value])

const isTimeFormValid = computed(() => {
  return timeForm.taskId !== null && timeForm.startHour !== '' && timeForm.startMinute !== '' && timeForm.endHour !== '' && timeForm.endMinute !== ''
})

function to24Hour(period, hour) {
  const h = parseInt(hour, 10)
  if (period === '오전') return h === 12 ? 0 : h
  return h === 12 ? 12 : h + 12
}

function buildLocalDateTime(period, hour, minute) {
  return `${dateParam.value}T${String(to24Hour(period, hour)).padStart(2, '0')}:${String(parseInt(minute, 10)).padStart(2, '0')}:00`
}

function checkOverlap(newStart, newEnd) {
  for (const st of studyTimes.value) {
    const existStart = new Date(st.startedAt).getTime()
    const existEnd = new Date(st.endedAt).getTime()
    if (newStart < existEnd && newEnd > existStart) return true
  }
  return false
}

async function openTimeModal() {
  showMenu.value = false
  timeError.value = ''
  timeForm.taskId = null
  timeForm.startPeriod = '오전'
  timeForm.startHour = ''
  timeForm.startMinute = ''
  timeForm.endPeriod = '오전'
  timeForm.endHour = ''
  timeForm.endMinute = ''
  showTimeModal.value = true
}

function closeTimeModal() {
  showTimeModal.value = false
  timeError.value = ''
}

async function handleTimeSubmit() {
  if (!isTimeFormValid.value || timeSubmitting.value) return

  timeError.value = ''

  const startedAt = buildLocalDateTime(timeForm.startPeriod, timeForm.startHour, timeForm.startMinute)
  const endedAt = buildLocalDateTime(timeForm.endPeriod, timeForm.endHour, timeForm.endMinute)

  const startTime = new Date(startedAt).getTime()
  const endTime = new Date(endedAt).getTime()

  if (endTime <= startTime) {
    timeError.value = '종료 시간이 시작 시간보다 빨라요.'
    return
  }

  if (checkOverlap(startTime, endTime)) {
    timeError.value = '기존 공부 시간과 겹쳐요.'
    return
  }

  timeSubmitting.value = true
  const memberId = getCookie('memberId')

  try {
    await createStudyTime(Number(memberId), { taskId: timeForm.taskId, startedAt, endedAt })
    closeTimeModal()
    await fetchData() // 타임테이블 갱신
  } catch (e) {
    console.error('공부 시간 등록 실패:', e)
    timeError.value = '등록에 실패했습니다.'
  } finally {
    timeSubmitting.value = false
  }
}

async function fetchData() {
  try {
    loading.value = true
    const memberId = getCookie('memberId')
    if (!memberId) return

    const [tasksRes, commentRes, studyTimeRes] = await Promise.all([
      getDailyTasks(memberId, dateParam.value),
      getPlannerComment(memberId, dateParam.value).catch(() => null),
      getStudyTime(memberId, dateParam.value).catch(() => null),
    ])

    tasks.value = tasksRes.data || []
    plannerComment.value = commentRes?.data || null
    studyTimes.value = studyTimeRes?.data?.studyTimes || []
    commentExpanded.value = false
    checkCommentTruncation()
  } catch (e) {
    console.error('Failed to fetch planner data:', e)
  } finally {
    loading.value = false
  }
}

async function checkCommentTruncation() {
  // v-if가 true로 바뀐 후 DOM 반영까지 2틱 대기
  await nextTick()
  await nextTick()
  const el = commentTextRef.value
  if (el) {
    isCommentTruncated.value = el.scrollHeight > el.clientHeight
  } else {
    isCommentTruncated.value = false
  }
}

// ─── 코멘트 CRUD ───
const showCommentModal = ref(false)
const commentEditMode = ref(false)
const commentText = ref('')
const commentSubmitting = ref(false)

function openCommentCreate() {
  commentEditMode.value = false
  commentText.value = ''
  showCommentModal.value = true
}

function openCommentEdit() {
  commentEditMode.value = true
  commentText.value = plannerComment.value?.comment || ''
  showCommentModal.value = true
}

function closeCommentModal() {
  showCommentModal.value = false
  commentText.value = ''
}

async function handleCommentSubmit() {
  if (!commentText.value.trim() || commentSubmitting.value) return
  const memberId = getCookie('memberId')
  if (!memberId) return

  commentSubmitting.value = true
  try {
    if (commentEditMode.value) {
      await updatePlannerComment(Number(memberId), plannerComment.value.id, { comment: commentText.value.trim() })
    } else {
      await createPlannerComment(Number(memberId), { date: dateParam.value, comment: commentText.value.trim() })
    }
    closeCommentModal()
    await fetchData()
  } catch (e) {
    console.error('코멘트 저장 실패:', e)
  } finally {
    commentSubmitting.value = false
  }
}

async function handleDeleteComment() {
  if (!plannerComment.value) return
  const memberId = getCookie('memberId')
  if (!memberId) return

  try {
    await deletePlannerComment(Number(memberId), plannerComment.value.id)
    plannerComment.value = null
    commentExpanded.value = false
  } catch (e) {
    console.error('코멘트 삭제 실패:', e)
  }
}

// ─── 플래너 마감 ───
const showCompleteConfirm = ref(false)
const completeSubmitting = ref(false)

async function handleComplete() {
  if (completeSubmitting.value || !plannerComment.value) return
  const memberId = getCookie('memberId')
  if (!memberId) return

  completeSubmitting.value = true
  try {
    await completePlanner(Number(memberId), plannerComment.value.id)
    showCompleteConfirm.value = false
    await fetchData()
  } catch (e) {
    console.error('플래너 마감 실패:', e)
  } finally {
    completeSubmitting.value = false
  }
}

watch(dateParam, () => {
  fetchData()
})

// 알림 클릭 등으로 ?date= 쿼리가 변경되면 해당 날짜로 이동
watch(() => route.query.date, (newDate) => {
  if (newDate) {
    currentDate.value = new Date(newDate + 'T00:00:00')
  }
})

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.home-page {
  padding: 16px 20px 80px;
  background: #fff;
  min-height: 100%;
}

/* Date Header */
.date-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.date-nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.date-title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

/* Comment Card */
.comment-card {
  background: #F6F7F9;
  border-radius: 12px;
  padding: 20px 20px 16px;
  margin-top: 12px;
  margin-bottom: 12px;
  position: relative;
}

.comment-badge {
  position: absolute;
  top: -10px;
  left: 16px;
  background: #36E27D;
  color: black;
  font-size: 10px;
  font-weight: 700;
  padding: 6px 8px;
  border-radius: 10.5px;
  display: flex;
  z-index: 1;
  gap: 4px;
}

.comment-badge img {
  width: 12px;
  height: 12px;
}

.comment-text {
  font-size: 16px;
  font-weight: 500;
  color: #3D3D3D;
  line-height: 1.6;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.comment-text.expanded {
  -webkit-line-clamp: unset;
}

.comment-content.clickable {
  cursor: pointer;
}

.comment-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 4px;
}

.comment-hint {
  color: #8E8E93;
  font-size: 14px;
  font-weight: 600;
}

.comment-edit-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comment-add-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #8E8E93;
  padding: 4px 0;
  width: 100%;
  text-align: left;
}

/* 플래너 마감 */
.complete-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 4px;
  margin-bottom: 4px;
}

.complete-btn {
  background: #36E27D;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  border: none;
  border-radius: 50px;
  padding: 8px 18px;
  cursor: pointer;
  transition: background 0.15s;
}

.complete-btn:active {
  background: #2bc96d;
}

.stamp-img {
  position: absolute;
  top: -40px;
  right: -15px;
  width: 72px;
  height: 72px;
  object-fit: contain;
  transform: rotate(10deg);
  z-index: 2;
  pointer-events: none;
}

/* 스탬프가 있을 때 코멘트 카드 상단 여백 추가 */
.comment-card.has-stamp {
  padding-top: 28px;
}

.confirm-modal {
  padding: 24px !important;
  width: 300px;
}

.confirm-text {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 20px;
  line-height: 1.5;
}

.comment-modal {
  padding: 24px !important;
  width: 320px;
}

.comment-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border-radius: 12px;
  border: none;
  background: #F5F5F5;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
  resize: none;
  margin-bottom: 16px;
}

/* Planner Content */
.planner-content {
  display: flex;
  gap: 0;
}

.task-side {
  flex: 1;
  min-width: 0;
}

.task-side.full-width {
  flex: 1;
}

/* Task Section */
.task-section {
  margin-bottom: 24px;
}

.task-section-label {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  color: #8A9093;
  background: #F6F7F9;
  padding: 6px 12px;
  border-radius: 50px;
  margin-bottom: 12px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
}

.task-checkbox {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #E5E5EA;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
  margin-top: 2px;
}

.task-checkbox.checked {
  background: #0CA5FE;
  border-color: #0CA5FE;
}

.task-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-goal {
  font-size: 12px;
  color: #A6A6A6;
  font-weight: 500;
}

.task-title {
  font-size: 14px;
  font-weight: 700;
  color: #1A1A1A;
  word-break: break-word;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.task-title.task-checked {
  text-decoration: line-through;
  color: #A6A6A6;
}

.task-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.subject-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 50px;
}

.tag-ETC {
  background: #F3F4F6;
  color: #6B7280;
}

.goal-tag {
  font-size: 12px;
  font-weight: 500;
  color: #8E8E93;
}

.task-time {
  font-size: 14px;
  font-weight: 600;
  /* color: #8E8E93; */
  flex-shrink: 0;
  /* margin-top: 4px; */
}

.task-chevron {
  flex-shrink: 0;
  margin-top: 6px;
}

/* Toggle Row */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 8px;
  gap: 8px;
}

.add-task-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #A6A6A6;
  padding: 0;
  margin-right: auto;
}

.toggle-timetable-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

/* Timetable */
.timetable-side {
  width: 50%;
  flex-shrink: 0;
}

.timetable {}

.time-row {
  display: flex;
  align-items: stretch;
  height: 32px;
}

.time-label {
  width: 22px;
  font-size: 10px;
  color: #C2C2C2;
  font-weight: 500;
  flex-shrink: 0;
  line-height: 1;
  transform: translateY(-5px);
  text-align: right;
  padding-right: 4px;
}

.time-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  position: relative;
}

.time-grid-cell {
  border-top: 1px solid #EBEBEB;
  border-right: 1px solid #EBEBEB;
  min-height: 100%;
}

.time-grid-cell:first-child {
  border-left: 1px solid #EBEBEB;
}

.last-row .time-grid-cell {
  border-bottom: 1px solid #EBEBEB;
}

.time-row-label-only {
  height: auto;
}

/* 형광펜 스타일 블록 오버레이 (행 내부) */
.study-block {
  position: absolute;
  top: 2px;
  bottom: 2px;
  border-radius: 7px;
  pointer-events: none;
  z-index: 1;
}

.study-block.block-ENG {
  background: rgba(128, 235, 190, 0.70);
}

.study-block.block-MATH {
  background: rgba(116, 88, 255, 0.55);
}

.study-block.block-KOR {
  background: rgba(235, 48, 161, 0.44);
}

.study-block.block-ETC {
  background: rgba(209, 213, 219, 0.5);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #A6A6A6;
  font-size: 14px;
}

/* FAB Button */
.fab-btn {
  position: fixed;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #0CA5FE;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(12, 165, 254, 0.3);
  right: 20px;
  bottom: 110px;
  transition: transform 0.15s;
}

.fab-btn:active {
  transform: scale(0.95);
}

/* FAB Menu */
.menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.5);
}

.fab-menu {
  position: fixed;
  z-index: 50;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  padding: 8px 24px;
  min-width: 225px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.fab-menu-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 16px 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.fab-menu-divider {
  height: 1px;
  background: #F0F0F0;
}

/* Transitions */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.25s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.popup-enter-active,
.popup-leave-active {
  transition: all 0.2s ease;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9) !important;
}

/* 시간 추가 모달 */
.time-modal {
  padding: 24px !important;
  width: 320px;
}

.time-modal-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 20px;
}

.time-modal-field {
  margin-bottom: 16px;
}

.time-modal-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.time-modal-select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #E5E5EA;
  font-size: 14px;
  color: #333;
  background: #fff;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.time-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.period-toggle {
  display: flex;
  border-radius: 50px;
  padding: 2px;
  background: #F3F4F6;
  flex-shrink: 0;
}

.period-btn {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 50px;
  border: none;
  cursor: pointer;
  background: transparent;
  color: #8E8E93;
  transition: all 0.15s;
}

.period-btn.active {
  background: #fff;
  color: #333;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.time-input {
  width: 52px;
  text-align: center;
  padding: 8px 4px;
  border-radius: 12px;
  border: none;
  background: #F5F5F5;
  font-size: 14px;
  outline: none;
}

.time-input::-webkit-inner-spin-button,
.time-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.time-colon {
  font-size: 14px;
  color: #8E8E93;
}

.time-modal-error {
  text-align: center;
  font-size: 13px;
  color: #E9412E;
  margin-bottom: 12px;
}

.time-modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.time-modal-cancel {
  flex: 1;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #E5E5EA;
  background: #fff;
  font-size: 15px;
  font-weight: 600;
  color: #8E8E93;
  cursor: pointer;
}

.time-modal-submit {
  flex: 1;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: #333;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
}

.time-modal-submit.disabled {
  background: #D1D1D6;
  cursor: not-allowed;
}

/* Skeleton */
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
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

.skeleton-text {
  border-radius: 6px;
}
</style>
