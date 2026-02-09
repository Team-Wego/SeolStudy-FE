<template>
  <Transition name="overlay">
    <div class="modal-overlay" @click="$emit('close')" />
  </Transition>

  <Transition name="popup">
    <div class="modal-content">
      <h2 class="modal-title">과제 등록</h2>

      <div class="form-field">
        <label class="form-label">날짜 선택 <span class="required">*</span></label>
        <div class="date-selection-wrapper">
          <input type="date" class="form-input date-picker" @change="addDate" />
          <div v-if="form.dates.length > 0" class="selected-dates-chips">
            <div v-for="(date, idx) in form.dates" :key="idx" class="date-chip">
              {{ date }}
              <button class="chip-remove" @click="removeDate(idx)">
                <X :size="12" />
              </button>
            </div>
          </div>
          <p v-else class="helper-text">과제를 등록할 날짜를 선택해주세요. (다중 선택 가능)</p>
        </div>
      </div>

      <div class="form-field">
        <label class="form-label">할 일 <span class="required">*</span></label>
        <input v-model="form.title" type="text" class="form-input" placeholder="할 일을 입력해주세요." />
      </div>

      <div class="form-field">
        <label class="form-label">과목 <span class="required">*</span></label>
        <div class="subject-buttons">
          <button v-for="subj in subjects" :key="subj.value" class="subject-btn"
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
        <textarea v-model="form.description" class="form-textarea" placeholder="내용을 입력해주세요." rows="3" />
      </div>

      <div class="form-field">
        <label class="form-label">파일 첨부</label>
        <div class="file-upload-wrapper">
          <input ref="fileInputRef" type="file" multiple hidden @change="handleFileSelect" />
          <button class="file-add-btn" @click="fileInputRef?.click()">
            <Paperclip :size="16" /> 파일 선택하기
          </button>
          <div v-if="form.files.length > 0" class="attached-file-list">
            <div v-for="(file, idx) in form.files" :key="idx" class="attached-file-item">
              <span class="file-name">{{ file.name }}</span>
              <button class="file-remove-btn" @click="removeFile(idx)">
                <X :size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="cancel-btn" @click="$emit('close')">취소</button>
        <button class="submit-btn" :disabled="!isValid || submitting" @click="handleSubmit">
          {{ submitting ? '등록 중...' : '등록하기' }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { X, Paperclip } from 'lucide-vue-next'
import { createTask } from '@/api/task/taskApi'
import { getGoals } from '@/api/mentoring/goalApi'

const props = defineProps({
  menteeId: { type: [Number, String], required: true },
  date: { type: String, default: '' },
})

const emit = defineEmits(['close', 'created'])

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
  dates: props.date ? [props.date] : [], // 다중 날짜 배열
  title: '',
  subject: null,
  goalId: null,
  description: '',
  files: [], // 첨부 파일 배열
})

const goals = ref([])
const submitting = ref(false)
const fileInputRef = ref(null)

const isValid = computed(() => form.title.trim() && form.subject && form.dates.length > 0)

onMounted(async () => {
  try {
    const { data } = await getGoals(Number(props.menteeId))
    goals.value = data || []
  } catch (e) {
    console.error('목표 목록 조회 실패:', e)
  }
})

/* 날짜 관련 로직 */
function addDate(e) {
  const selected = e.target.value
  if (selected && !form.dates.includes(selected)) {
    form.dates.push(selected)
    form.dates.sort() // 날짜순 정렬
  }
  e.target.value = '' // 입력창 초기화
}

function removeDate(idx) {
  form.dates.splice(idx, 1)
}

/* 파일 관련 로직 */
function handleFileSelect(e) {
  const selectedFiles = Array.from(e.target.files || [])
  form.files = [...form.files, ...selectedFiles]
  e.target.value = ''
}

function removeFile(idx) {
  form.files.splice(idx, 1)
}

/* 제출 로직 */
async function handleSubmit() {
  if (!isValid.value || submitting.value) return

  submitting.value = true
  try {
    // 백엔드 API 설계에 따라 다중 날짜 처리를 순회하거나 다중 날짜용 API 호출
    // 여기서는 기존 단일 등록 API를 날짜 수만큼 호출하는 예시입니다. (API가 리스트를 받는다면 수정 필요)
    const promises = form.dates.map(date => {
      return createTask(Number(props.menteeId), {
        title: form.title.trim(),
        date: date,
        subject: subjectToEnum[form.subject],
        description: form.description.trim() || null,
        goalId: form.goalId || null,
      }, form.files) // 파일도 같이 전송 (API에서 multipart 대응 필요)
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
/* 기존 스타일 유지 및 추가 */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: fixed;
  z-index: 50;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  padding: 32px;
  width: 460px;
  /* 약간 넓힘 */
  max-height: 90vh;
  /* 높이 조절 */
  overflow-y: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 24px;
}

.form-field {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.required {
  color: #e9412e;
}

/* 날짜 칩 스타일 */
.date-selection-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-dates-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.date-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f0f9ff;
  color: #0ca5fe;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid #bae6fd;
}

.chip-remove {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  color: #0ca5fe;
}

.helper-text {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #f5f5f5;
  background: #f5f5f5;
  font-size: 14px;
  outline: none;
  color: #333;
}

.subject-buttons {
  display: flex;
  gap: 8px;
}

.subject-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #e5e5ea;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #8e8e93;
  cursor: pointer;
}

.subject-btn.active {
  background: #0ca5fe;
  color: #fff;
  border-color: #0ca5fe;
}

/* 파일 업로드 스타일 */
.file-upload-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 12px;
  border: 1px dashed #d1d1d6;
  background: #fff;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.attached-file-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attached-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f9f9f9;
  border-radius: 8px;
  font-size: 13px;
}

.file-name {
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-remove-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.cancel-btn,
.submit-btn {
  flex: 1;
  padding: 14px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn {
  border: 1px solid #e5e5ea;
  background: #fff;
  color: #8e8e93;
}

.submit-btn {
  border: none;
  background: #0ca5fe;
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
  transition: all 0.2s ease;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9) !important;
}
</style>
