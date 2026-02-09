<template>
  <Transition name="overlay">
    <div class="modal-overlay" @click="$emit('close')" />
  </Transition>

  <Transition name="popup">
    <div class="modal-content">
      <h2 class="modal-title">과제 등록</h2>

      <div class="form-field">
        <label class="form-label">날짜 선택 <span class="required">*</span></label>
        <div class="inline-calendar">
          <div class="calendar-nav">
            <button type="button" class="nav-btn" @click="prevMonth">
              <ChevronLeft :size="18" />
            </button>
            <span class="view-month">{{ viewYear }}년 {{ viewMonth + 1 }}월</span>
            <button type="button" class="nav-btn" @click="nextMonth">
              <ChevronRight :size="18" />
            </button>
          </div>
          <div class="calendar-grid">
            <span v-for="d in ['월', '화', '수', '목', '금', '토', '일']" :key="d" class="day-label">{{ d }}</span>
            <div v-for="(dateObj, idx) in calendarDates" :key="idx" class="calendar-date" :class="{
              'not-current': !dateObj.isCurrentMonth,
              'is-selected': isSelected(dateObj.fullDate),
              'is-today': dateObj.fullDate === todayStr()
            }" @click="toggleDate(dateObj.fullDate)">
              <span class="date-text">{{ dateObj.day }}</span>
            </div>
          </div>
        </div>
        <div class="selected-summary">
          <span v-if="form.dates.length > 0">
            <strong>{{ form.dates.length }}개</strong>의 날짜 선택됨
          </span>
          <span v-else class="empty-msg">날짜를 클릭하여 선택해주세요.</span>
        </div>
      </div>

      <div class="form-field">
        <label class="form-label">할 일 <span class="required">*</span></label>
        <input v-model="form.title" type="text" class="form-input" placeholder="할 일을 입력해주세요." />
      </div>

      <div class="form-field">
        <label class="form-label">과목 <span class="required">*</span></label>
        <div class="subject-buttons">
          <button v-for="subj in subjects" :key="subj.value" type="button" class="subject-btn"
            :class="{ active: form.subject === subj.value }" @click="form.subject = subj.value">
            {{ subj.label }}
          </button>
        </div>
      </div>

      <div class="form-field">
        <label class="form-label">목표</label>
        <select v-model="form.goalId" class="form-select">
          <option :value="null">목표를 선택해주세요.</option>
          <option v-for="goal in goals" :key="goal.goalId" :value="goal.goalId">
            {{ goal.name }}
          </option>
        </select>
      </div>

      <div class="form-field">
        <label class="form-label">내용</label>
        <textarea v-model="form.description" class="form-textarea" placeholder="상세 내용을 입력해주세요." rows="3" />
      </div>

      <div class="form-field">
        <label class="form-label">파일 첨부</label>
        <div class="file-upload-wrapper">
          <input ref="fileInputRef" type="file" multiple hidden @change="handleFileSelect" />
          <button type="button" class="file-add-btn" @click="fileInputRef?.click()">
            <Paperclip :size="16" /> 파일 선택하기
          </button>
          <div v-if="form.files.length > 0" class="attached-file-list">
            <div v-for="(file, idx) in form.files" :key="idx" class="attached-file-item">
              <span class="file-name">{{ file.name }}</span>
              <button type="button" class="file-remove-btn" @click="removeFile(idx)">
                <X :size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="cancel-btn" @click="$emit('close')">취소</button>
        <button type="button" class="submit-btn" :disabled="!isValid || submitting" @click="handleSubmit">
          {{ submitting ? '등록 중...' : '등록하기' }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { X, Paperclip, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { createTask } from '@/api/task/taskApi'
import { getGoals } from '@/api/mentoring/goalApi'

const props = defineProps({
  menteeId: { type: [Number, String], required: true },
  date: { type: String, default: '' },
})

const emit = defineEmits(['close', 'created'])

// 달력 표시용 상태
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())

const subjects = [
  { label: '국어', value: 'korean' },
  { label: '영어', value: 'english' },
  { label: '수학', value: 'math' },
]

const subjectToEnum = {
  korean: 'KOR',
  english: 'ENG',
  math: 'MATH',
}

const form = reactive({
  dates: props.date ? [props.date] : [],
  title: '',
  subject: null,
  goalId: null,
  description: '',
  files: [],
})

const goals = ref([])
const submitting = ref(false)
const fileInputRef = ref(null)

const isValid = computed(() => form.title.trim() && form.subject && form.dates.length > 0)

/* --- 유틸리티 함수 --- */
function todayStr() {
  const d = new Date()
  return formatDate(d)
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/* --- 달력 로직 --- */
const calendarDates = computed(() => {
  const dates = []
  const firstDay = new Date(viewYear.value, viewMonth.value, 1)
  const lastDay = new Date(viewYear.value, viewMonth.value + 1, 0)

  // 월요일 시작을 위해 보정 (0:일, 1:월...)
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  // 이전 달 날짜
  for (let i = startOffset; i > 0; i--) {
    const d = new Date(viewYear.value, viewMonth.value, 1 - i)
    dates.push({ day: d.getDate(), fullDate: formatDate(d), isCurrentMonth: false })
  }
  // 이번 달 날짜
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(viewYear.value, viewMonth.value, i)
    dates.push({ day: i, fullDate: formatDate(d), isCurrentMonth: true })
  }
  // 다음 달 날짜 (6줄 고정을 위해 42개 맞춤)
  const remaining = 42 - dates.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(viewYear.value, viewMonth.value + 1, i)
    dates.push({ day: d.getDate(), fullDate: formatDate(d), isCurrentMonth: false })
  }
  return dates
})

function toggleDate(dateStr) {
  const index = form.dates.indexOf(dateStr)
  if (index > -1) {
    form.dates.splice(index, 1)
  } else {
    form.dates.push(dateStr)
  }
}

function isSelected(dateStr) {
  return form.dates.includes(dateStr)
}

function prevMonth() {
  if (viewMonth.value === 0) {
    viewYear.value--
    viewMonth.value = 11
  } else {
    viewMonth.value--
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewYear.value++
    viewMonth.value = 0
  } else {
    viewMonth.value++
  }
}

/* --- 파일 및 목표 로직 --- */
function handleFileSelect(e) {
  const selectedFiles = Array.from(e.target.files || [])
  form.files = [...form.files, ...selectedFiles]
  e.target.value = ''
}

function removeFile(idx) {
  form.files.splice(idx, 1)
}

onMounted(async () => {
  try {
    const { data } = await getGoals(Number(props.menteeId))
    goals.value = data || []
  } catch (e) {
    console.error('목표 목록 조회 실패:', e)
  }
})

/* --- 제출 로직 --- */
async function handleSubmit() {
  if (!isValid.value || submitting.value) return

  submitting.value = true
  try {
    // 선택된 모든 날짜에 대해 병렬 등록 요청
    const promises = form.dates.map(date => {
      return createTask(Number(props.menteeId), {
        title: form.title.trim(),
        date: date,
        subject: subjectToEnum[form.subject],
        description: form.description.trim() || null,
        goalId: form.goalId || null,
      }, form.files)
    })

    await Promise.all(promises)
    emit('created')
  } catch (e) {
    console.error('과제 등록 실패:', e)
    alert('과제 등록에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: fixed;
  z-index: 50;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  padding: 32px;
  width: 440px;
  max-height: 95vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 24px;
  color: #1a1a1a;
}

.form-field {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #333;
}

.required {
  color: #ff4d4f;
}

/* 인라인 달력 스타일 */
.inline-calendar {
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  padding: 16px;
  background: #fafafa;
}

.calendar-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.view-month {
  font-size: 14px;
  font-weight: 800;
  color: #1a1a1a;
}

.nav-btn {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-label {
  font-size: 11px;
  font-weight: 600;
  color: #999;
  text-align: center;
  padding-bottom: 8px;
}

.calendar-date {
  aspect-ratio: 1/1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  position: relative;
}

.calendar-date:hover {
  background: #eee;
}

.calendar-date.not-current {
  color: #ccc;
}

.calendar-date.is-selected {
  background: #0ca5fe !important;
  color: #fff !important;
  font-weight: 700;
}

.calendar-date.is-today::after {
  content: '';
  position: absolute;
  bottom: 4px;
  width: 4px;
  height: 4px;
  background: #0ca5fe;
  border-radius: 50%;
}

.calendar-date.is-selected.is-today::after {
  background: #fff;
}

.selected-summary {
  margin-top: 10px;
  font-size: 12px;
  color: #666;
  text-align: right;
}

.empty-msg {
  color: #bbb;
}

/* 입력 필드 공통 */
.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  background: #f9f9f9;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: #0ca5fe;
  background: #fff;
}

.subject-buttons {
  display: flex;
  gap: 8px;
}

.subject-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #eee;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
}

.subject-btn.active {
  background: #0ca5fe;
  color: #fff;
  border-color: #0ca5fe;
}

/* 파일 업로드 */
.file-add-btn {
  width: 100%;
  padding: 10px;
  border-radius: 12px;
  border: 1px dashed #ccc;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.attached-file-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attached-file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 13px;
}

.file-name {
  color: #444;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-remove-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 2px;
}

/* 액션 버튼 */
.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.cancel-btn,
.submit-btn {
  flex: 1;
  padding: 14px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.cancel-btn {
  background: #fff;
  border: 1px solid #eee;
  color: #999;
}

.submit-btn {
  background: #0ca5fe;
  border: none;
  color: #fff;
}

.submit-btn:disabled {
  background: #d1d1d6;
  cursor: not-allowed;
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
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -40%) scale(0.95);
}
</style>