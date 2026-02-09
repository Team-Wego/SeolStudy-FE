<template>
  <div class="monthly-schedule">
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

    <div class="calendar-card">
      <div class="day-labels">
        <span v-for="label in dayLabels" :key="label" class="day-label">{{ label }}</span>
      </div>
      <div class="calendar-grid">
        <div v-for="(d, idx) in monthDates" :key="idx" class="calendar-cell" :class="{
          'other-month': d && d.getMonth() !== currentMonth,
          'selected': d && selectedDate && isSameDate(d, selectedDate),
          'has-task': d && hasTaskOn(d),
        }" @click="d && selectDate(d)">
          <span v-if="d" class="cell-date">{{ d.getDate() }}</span>
          <div v-if="d && hasTaskOn(d)" class="task-dot"></div>
        </div>
      </div>
    </div>

    <div v-if="selectedDate" class="selected-date-info">
      <h4 class="selected-date-title">
        {{ selectedDate.getMonth() + 1 }}월 {{ selectedDate.getDate() }}일 과제
      </h4>
      <div v-if="selectedDateTasks.length === 0" class="empty-text">
        등록된 과제가 없습니다.
      </div>
      <div v-for="task in selectedDateTasks" :key="task.id" class="date-task-item">
        <SubjectTag v-if="subjectTagMap[task.subject]" :subject="subjectTagMap[task.subject]" size="sm" />
        <span class="date-task-title">{{ task.title }}</span>
        <StatusBadge :type="task.isChecked ? 'complete' : 'incomplete'" size="sm" />
      </div>
    </div>

    <div class="section-card">
      <h3 class="section-title">주간피드백 📂</h3>

      <div class="week-tabs">
        <button v-for="(week, idx) in weeks" :key="idx" class="week-tab" :class="{ active: activeWeekIdx === idx }"
          @click="activeWeekIdx = idx">
          <span class="week-tab-label">{{ currentMonth + 1 }}월 {{ idx + 1 }}주차</span>
          <span class="week-tab-range">({{ week.rangeLabel }})</span>
        </button>
      </div>

      <div v-if="weeks.length > 0" class="weekly-feedback-area">
        <div v-if="activeWeekFeedback && !weeklyEditing" class="existing-feedback">
          <p v-html="renderHighlightedText(activeWeekFeedback.content, activeWeekFeedback.highlight)"></p>
          <div v-if="activeWeekFeedback.feedbackImages?.length" class="feedback-images">
            <img v-for="(img, idx) in activeWeekFeedback.feedbackImages" :key="img.imageId" :src="img.imageUrl"
              class="feedback-image"
              @click="openPreview(activeWeekFeedback.feedbackImages.map(i => i.imageUrl), idx)" />
          </div>
          <div class="feedback-actions">
            <button class="feedback-action-btn" @click="startWeeklyEdit">
              <Pencil :size="14" /> 수정
            </button>
            <button class="feedback-action-btn delete" @click="handleWeeklyDelete">
              <Trash2 :size="14" /> 삭제
            </button>
          </div>
        </div>

        <template v-else>
          <textarea ref="weeklyTextareaRef" v-model="weeklyFeedbackText" class="feedback-textarea"
            :placeholder="activeWeekFeedbackPlaceholder" />

          <div v-if="weeklyHighlight" class="highlight-preview">
            <Highlighter :size="12" color="#f9a825" />
            <span class="highlight-preview-text">{{ weeklyHighlight }}</span>
            <button class="highlight-remove-btn" @click="weeklyHighlight = ''">
              <X :size="12" />
            </button>
          </div>

          <div v-if="weeklyFiles.length > 0" class="attached-files">
            <div v-for="(file, idx) in weeklyFiles" :key="idx" class="attached-file">
              <Paperclip :size="12" color="#999" />
              <span class="attached-file-name">{{ file.name }}</span>
              <button class="attached-file-remove" @click="weeklyFiles.splice(idx, 1)">
                <X :size="12" />
              </button>
            </div>
          </div>

          <div class="feedback-btn-row">
            <button class="highlight-btn" @click="applyWeeklyHighlight">
              <Highlighter :size="16" /> 형광펜
            </button>
            <input ref="weeklyFileInputRef" type="file" accept="image/*" multiple hidden
              @change="handleWeeklyFileSelect" />
            <button class="attach-btn" @click="weeklyFileInputRef?.click()">
              <Paperclip :size="16" /> 사진 첨부
            </button>
            <button v-if="weeklyEditing" class="feedback-cancel-btn" @click="cancelWeeklyEdit">취소</button>
            <button class="feedback-submit-btn" :disabled="!weeklyFeedbackText.trim() || weeklySubmitting"
              @click="weeklyEditing ? handleWeeklyUpdate() : handleWeeklyFeedback()">
              {{ weeklySubmitting ? '처리 중...' : (weeklyEditing ? '수정 완료' : '등록하기') }}
            </button>
          </div>
        </template>
      </div>
    </div>

    <div class="section-card">
      <h3 class="section-title">월간 피드백 🎯</h3>

      <div v-if="monthlyFeedback && !monthlyEditing" class="existing-feedback">
        <p v-html="renderHighlightedText(monthlyFeedback.content, monthlyFeedback.highlight)"></p>
        <div v-if="monthlyFeedback.feedbackImages?.length" class="feedback-images">
          <img v-for="(img, idx) in monthlyFeedback.feedbackImages" :key="img.imageId" :src="img.imageUrl"
            class="feedback-image" @click="openPreview(monthlyFeedback.feedbackImages.map(i => i.imageUrl), idx)" />
        </div>
        <div class="feedback-actions">
          <button class="feedback-action-btn" @click="startMonthlyEdit">
            <Pencil :size="14" /> 수정
          </button>
          <button class="feedback-action-btn delete" @click="handleMonthlyDelete">
            <Trash2 :size="14" /> 삭제
          </button>
        </div>
      </div>

      <template v-else>
        <textarea ref="monthlyTextareaRef" v-model="monthlyFeedbackText" class="feedback-textarea"
          placeholder="이번 달 학생의 전반적인 성취도와 다음 달 방향성을 작성해주세요." />

        <div v-if="monthlyHighlight" class="highlight-preview">
          <Highlighter :size="12" color="#f9a825" />
          <span class="highlight-preview-text">{{ monthlyHighlight }}</span>
          <button class="highlight-remove-btn" @click="monthlyHighlight = ''">
            <X :size="12" />
          </button>
        </div>

        <div v-if="monthlyFiles.length > 0" class="attached-files">
          <div v-for="(file, idx) in monthlyFiles" :key="idx" class="attached-file">
            <Paperclip :size="12" color="#999" />
            <span class="attached-file-name">{{ file.name }}</span>
            <button class="attached-file-remove" @click="monthlyFiles.splice(idx, 1)">
              <X :size="12" />
            </button>
          </div>
        </div>

        <div class="feedback-btn-row">
          <button class="highlight-btn" @click="applyMonthlyHighlight">
            <Highlighter :size="16" /> 형광펜
          </button>
          <input ref="monthlyFileInputRef" type="file" accept="image/*" multiple hidden
            @change="handleMonthlyFileSelect" />
          <button class="attach-btn" @click="monthlyFileInputRef?.click()">
            <Paperclip :size="16" /> 사진 첨부
          </button>
          <button v-if="monthlyEditing" class="feedback-cancel-btn" @click="cancelMonthlyEdit">취소</button>
          <button class="feedback-submit-btn" :disabled="!monthlyFeedbackText.trim() || monthlySubmitting"
            @click="monthlyEditing ? handleMonthlyUpdate() : handleMonthlyFeedback()">
            {{ monthlySubmitting ? '처리 중...' : (monthlyEditing ? '수정 완료' : '등록하기') }}
          </button>
        </div>
      </template>
    </div>

    <TaskCreateModal v-if="showTaskModal" :mentee-id="menteeId" :date="taskModalDate" @close="showTaskModal = false"
      @created="handleTaskCreated" />

    <Teleport to="body">
      <div v-if="previewModal.show" class="image-preview-overlay" @click.self="closePreview">
        <button class="preview-close-btn" @click="closePreview">
          <X :size="24" />
        </button>
        <div class="preview-image-wrapper">
          <img :src="previewModal.images[previewModal.index]" class="preview-image" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ChevronLeft, ChevronRight, Highlighter, X, Pencil, Trash2, Paperclip } from 'lucide-vue-next'
import SubjectTag from '@/components/common/SubjectTag.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import TaskCreateModal from './TaskCreateModal.vue'
import { getWeeklyTasks } from '@/api/task/taskApi'
import { getFeedbacks, createFeedback, updateFeedback, deleteFeedback } from '@/api/feedback/feedbackApi'

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

// 주간 피드백 상태
const weeklyFeedbackText = ref('')
const weeklyHighlight = ref('')
const weeklyEditing = ref(false)
const weeklySubmitting = ref(false)
const weeklyFiles = ref([])
const weeklyTextareaRef = ref(null)
const weeklyFileInputRef = ref(null)

// 월간 피드백 상태
const monthlyFeedbackText = ref('')
const monthlyHighlight = ref('')
const monthlyEditing = ref(false)
const monthlySubmitting = ref(false)
const monthlyFiles = ref([])
const monthlyTextareaRef = ref(null)
const monthlyFileInputRef = ref(null)

const showTaskModal = ref(false)
const taskModalDate = ref('')
const previewModal = ref({ show: false, images: [], index: 0 })

const dayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const subjectTagMap = { KOR: 'korean', ENG: 'english', MATH: 'math' }

/* --- 캘린더 로직 --- */
const monthDates = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()
  let startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  const dates = []
  for (let i = startOffset; i > 0; i--) {
    dates.push(new Date(year, month, 1 - i))
  }
  const lastDay = new Date(year, month + 1, 0).getDate()
  for (let i = 1; i <= lastDay; i++) {
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

const monthRange = computed(() => {
  const dates = monthDates.value
  if (dates.length === 0) return { start: '', end: '' }
  return { start: formatDate(dates[0]), end: formatDate(dates[dates.length - 1]) }
})

const weeks = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const result = []
  let weekStart = new Date(firstDay)
  while (weekStart <= lastDay) {
    const weekEnd = new Date(weekStart)
    const daysToSunday = 7 - (weekEnd.getDay() === 0 ? 7 : weekEnd.getDay())
    weekEnd.setDate(weekEnd.getDate() + daysToSunday)
    if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime())
    const startStr = `${String(weekStart.getMonth() + 1).padStart(2, '0')}.${String(weekStart.getDate()).padStart(2, '0')}`
    const endStr = `${String(weekEnd.getMonth() + 1).padStart(2, '0')}.${String(weekEnd.getDate()).padStart(2, '0')}`
    result.push({ start: formatDate(weekStart), end: formatDate(weekEnd), rangeLabel: `${startStr} ~ ${endStr}` })
    const next = new Date(weekEnd); next.setDate(next.getDate() + 1); weekStart = next
  }
  return result
})

const taskDateSet = computed(() => new Set(rangeTasks.value.map(t => t.date)))
const selectedDateTasks = computed(() => {
  if (!selectedDate.value) return []
  const dateStr = formatDate(selectedDate.value)
  return rangeTasks.value.filter((t) => t.date === dateStr)
})

const activeWeekFeedback = computed(() => {
  if (weeks.value.length === 0) return null
  const week = weeks.value[activeWeekIdx.value]
  return weeklyFeedbacks.value.find((f) => {
    return f.targetDate === week.start
  }) || null
})

const activeWeekFeedbackPlaceholder = computed(() => {
  if (weeks.value.length === 0) return ''
  return `${currentMonth.value + 1}월 ${activeWeekIdx.value + 1}주차 피드백을 작성하세요.`
})

/* --- 유틸리티 --- */
function formatDate(date) {
  const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
function isSameDate(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() }
function hasTaskOn(d) { return taskDateSet.value.has(formatDate(d)) }
function selectDate(d) { selectedDate.value = new Date(d) }
function navigateMonth(offset) {
  const d = new Date(currentYear.value, currentMonth.value + offset, 1)
  currentYear.value = d.getFullYear(); currentMonth.value = d.getMonth(); selectedDate.value = null; activeWeekIdx.value = 0
}

/* --- 공통 피드백 로직 --- */
function renderHighlightedText(content, highlight) {
  if (!content) return ''
  const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  if (!highlight) return escaped
  return escaped.split(highlight).join(`<span class="highlight-mark">${highlight}</span>`)
}

function openPreview(images, index) { previewModal.value = { show: true, images, index } }
function closePreview() { previewModal.value.show = false }

/* --- 주간 피드백 기능 --- */
function handleWeeklyFileSelect(e) { weeklyFiles.value = [...weeklyFiles.value, ...Array.from(e.target.files || [])]; e.target.value = '' }
function applyWeeklyHighlight() {
  const el = weeklyTextareaRef.value
  const selected = el.value.substring(el.selectionStart, el.selectionEnd).trim()
  if (selected) weeklyHighlight.value = selected
  else alert('형광펜을 적용할 텍스트를 드래그로 선택해주세요.')
}
function startWeeklyEdit() {
  weeklyFeedbackText.value = activeWeekFeedback.value.content
  weeklyHighlight.value = activeWeekFeedback.value.highlight || ''
  weeklyEditing.value = true
}
function cancelWeeklyEdit() { weeklyFeedbackText.value = ''; weeklyHighlight.value = ''; weeklyEditing.value = false }

async function handleWeeklyFeedback() {
  if (!weeklyFeedbackText.value.trim() || weeklySubmitting.value) return
  weeklySubmitting.value = true
  try {
    const data = {
      menteeId: Number(props.menteeId), type: 'WEEKLY',
      content: weeklyFeedbackText.value.trim(), targetDate: weeks.value[activeWeekIdx.value].start,
      highlight: weeklyHighlight.value || null
    }
    await createFeedback(data, weeklyFiles.value.length > 0 ? weeklyFiles.value : undefined)
    weeklyFeedbackText.value = ''; weeklyHighlight.value = ''; weeklyFiles.value = []
    await fetchFeedbacks()
  } catch (e) { console.error(e) } finally { weeklySubmitting.value = false }
}

async function handleWeeklyUpdate() {
  if (!weeklyFeedbackText.value.trim() || weeklySubmitting.value) return
  weeklySubmitting.value = true
  try {
    await updateFeedback(activeWeekFeedback.value.feedbackId, {
      content: weeklyFeedbackText.value.trim(), highlight: weeklyHighlight.value || null, imageChanged: false
    })
    weeklyEditing.value = false; await fetchFeedbacks()
  } catch (e) { console.error(e) } finally { weeklySubmitting.value = false }
}

async function handleWeeklyDelete() {
  if (!confirm('피드백을 삭제하시겠습니까?')) return
  try { await deleteFeedback(activeWeekFeedback.value.feedbackId); await fetchFeedbacks() } catch (e) { console.error(e) }
}

/* --- 월간 피드백 기능 --- */
function handleMonthlyFileSelect(e) { monthlyFiles.value = [...monthlyFiles.value, ...Array.from(e.target.files || [])]; e.target.value = '' }
function applyMonthlyHighlight() {
  const el = monthlyTextareaRef.value
  const selected = el.value.substring(el.selectionStart, el.selectionEnd).trim()
  if (selected) monthlyHighlight.value = selected
  else alert('형광펜을 적용할 텍스트를 드래그로 선택해주세요.')
}
function startMonthlyEdit() {
  monthlyFeedbackText.value = monthlyFeedback.value.content
  monthlyHighlight.value = monthlyFeedback.value.highlight || ''
  monthlyEditing.value = true
}
function cancelMonthlyEdit() { monthlyFeedbackText.value = ''; monthlyHighlight.value = ''; monthlyEditing.value = false }

async function handleMonthlyFeedback() {
  if (!monthlyFeedbackText.value.trim() || monthlySubmitting.value) return
  monthlySubmitting.value = true
  try {
    const data = {
      menteeId: Number(props.menteeId), type: 'MONTHLY',
      content: monthlyFeedbackText.value.trim(), targetDate: `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-01`,
      highlight: monthlyHighlight.value || null
    }
    await createFeedback(data, monthlyFiles.value.length > 0 ? monthlyFiles.value : undefined)
    monthlyFeedbackText.value = ''; monthlyHighlight.value = ''; monthlyFiles.value = []
    await fetchFeedbacks()
  } catch (e) { console.error(e) } finally { monthlySubmitting.value = false }
}

async function handleMonthlyUpdate() {
  if (!monthlyFeedbackText.value.trim() || monthlySubmitting.value) return
  monthlySubmitting.value = true
  try {
    await updateFeedback(monthlyFeedback.value.feedbackId, {
      content: monthlyFeedbackText.value.trim(), highlight: monthlyHighlight.value || null, imageChanged: false
    })
    monthlyEditing.value = false; await fetchFeedbacks()
  } catch (e) { console.error(e) } finally { monthlySubmitting.value = false }
}

async function handleMonthlyDelete() {
  if (!confirm('피드백을 삭제하시겠습니까?')) return
  try { await deleteFeedback(monthlyFeedback.value.feedbackId); await fetchFeedbacks() } catch (e) { console.error(e) }
}

/* --- 데이터 페칭 --- */
function openTaskModal() { taskModalDate.value = selectedDate.value ? formatDate(selectedDate.value) : formatDate(new Date()); showTaskModal.value = true }
function handleTaskCreated() { showTaskModal.value = false; fetchRangeTasks() }

async function fetchRangeTasks() {
  try {
    const { start, end } = monthRange.value
    if (!start || !end) return
    const { data } = await getWeeklyTasks(Number(props.menteeId), start, end)
    rangeTasks.value = data || []
  } catch (e) { console.error(e) }
}

async function fetchFeedbacks() {
  try {
    const menteeId = Number(props.menteeId)
    const [weeklyRes, monthlyRes] = await Promise.all([
      getFeedbacks(menteeId, 'WEEKLY').catch(() => ({ data: [] })),
      getFeedbacks(menteeId, 'MONTHLY').catch(() => ({ data: [] })),
    ])
    weeklyFeedbacks.value = weeklyRes.data || []
    const monthStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}`
    monthlyFeedback.value = (monthlyRes.data || []).find(f => f.createdAt?.startsWith(monthStr)) || null
  } catch (e) { console.error(e) }
}

watch(activeWeekIdx, () => {
  // 수정 모드 종료
  weeklyEditing.value = false;

  // 입력 필드 및 하이라이트, 파일 초기화
  weeklyFeedbackText.value = '';
  weeklyHighlight.value = '';
  weeklyFiles.value = [];

  // 만약 현재 주차에 이미 피드백이 있다면, 
  // '등록하기' 버튼이 아닌 '기존 피드백 표시'가 기본이 되도록 함
});

watch(() => `${currentYear.value}-${currentMonth.value}`, () => { fetchRangeTasks(); fetchFeedbacks(); cancelWeeklyEdit(); cancelMonthlyEdit() })
onMounted(() => { fetchRangeTasks(); fetchFeedbacks() })
</script>

<style scoped>
.monthly-schedule {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 캘린더 */
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
  gap: 8px;
}

.calendar-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1 / 1;
  max-width: 44px;
  justify-self: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.15s;
  position: relative;
}

.task-dot {
  position: absolute;
  bottom: 6px;
  width: 4px;
  height: 4px;
  background-color: #4af38a;
  border-radius: 50%;
}

.calendar-cell.selected {
  background: #4af38a;
}

.calendar-cell.selected .cell-date {
  color: #fff;
}

.calendar-cell.selected .task-dot {
  color: #fff;
  background-color: #fff;
}

.calendar-cell.other-month .cell-date {
  color: #d1d1d6;
}

.cell-date {
  font-size: 14px;
  color: #333;
}

/* 섹션 공통 */
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

/* 피드백 UI */
.existing-feedback {
  background: #f6f7f9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
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
  font-size: 13px;
  line-height: 1.6;
  outline: none;
  resize: none;
}

.feedback-btn-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.feedback-submit-btn {
  flex: 2;
  padding: 10px;
  border-radius: 10px;
  border: none;
  background: #333;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.feedback-submit-btn:disabled {
  background: #d1d1d6;
}

.highlight-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: #fff59d;
  color: #5d4037;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.attach-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.feedback-cancel-btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #666;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.highlight-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-top: 8px;
  background: #fffde7;
  border: 1px solid #fff59d;
  border-radius: 8px;
  font-size: 12px;
}

.highlight-preview-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.highlight-remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
}

.attached-files {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.attached-file {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 12px;
}

.attached-file-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attached-file-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
}

.feedback-images {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.feedback-image {
  width: 100px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}

.feedback-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
}

.feedback-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
}

.feedback-action-btn.delete {
  color: #e53935;
  border-color: #ffcdd2;
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
}

.week-tab-range {
  font-size: 11px;
  color: #8e8e93;
}

/* 형광펜 효과 */
:deep(.highlight-mark) {
  background-color: #fff59d;
  border-radius: 2px;
  padding: 0 2px;
}

/* 선택 날짜 정보 */
.selected-date-info {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.selected-date-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
}

.date-task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}

.date-task-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
}

.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
}

.preview-image {
  max-width: 85vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
}
</style>