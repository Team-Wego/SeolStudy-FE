<template>
  <!-- 오버레이 -->
  <Transition name="overlay">
    <div class="modal-overlay" @click="$emit('close')" />
  </Transition>

  <!-- 모달 -->
  <Transition name="popup">
    <div class="modal-content">
      <h2 class="modal-title">과제 등록</h2>

      <!-- 날짜 -->
      <div class="form-field">
        <label class="form-label">날짜 <span class="required">*</span></label>
        <input v-model="form.date" type="date" class="form-input" />
      </div>

      <!-- 할 일 -->
      <div class="form-field">
        <label class="form-label">할 일 <span class="required">*</span></label>
        <input
          v-model="form.title"
          type="text"
          class="form-input"
          placeholder="할 일을 입력해주세요."
        />
      </div>

      <!-- 과목 -->
      <div class="form-field">
        <label class="form-label">과목 <span class="required">*</span></label>
        <div class="subject-buttons">
          <button
            v-for="subj in subjects"
            :key="subj.value"
            class="subject-btn"
            :class="{ active: form.subject === subj.value }"
            @click="form.subject = subj.value"
          >
            {{ subj.label }}
          </button>
        </div>
      </div>

      <!-- 목표 -->
      <div class="form-field">
        <label class="form-label">목표</label>
        <select v-model="form.goalId" class="form-select">
          <option :value="null">목표를 선택해주세요.</option>
          <option v-for="goal in goals" :key="goal.goalId" :value="goal.goalId">
            {{ goal.name }}
          </option>
        </select>
      </div>

      <!-- 내용 -->
      <div class="form-field">
        <label class="form-label">내용</label>
        <textarea
          v-model="form.description"
          class="form-textarea"
          placeholder="내용을 입력해주세요."
          rows="4"
        />
      </div>

      <!-- 버튼 -->
      <div class="modal-actions">
        <button class="cancel-btn" @click="$emit('close')">취소</button>
        <button
          class="submit-btn"
          :disabled="!isValid || submitting"
          @click="handleSubmit"
        >
          {{ submitting ? '등록 중...' : '등록하기' }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const form = reactive({
  date: props.date || todayStr(),
  title: '',
  subject: null,
  goalId: null,
  description: '',
})

const goals = ref([])
const submitting = ref(false)

const isValid = computed(() => form.title.trim() && form.subject)

onMounted(async () => {
  try {
    const { data } = await getGoals(Number(props.menteeId))
    goals.value = data || []
  } catch (e) {
    console.error('목표 목록 조회 실패:', e)
  }
})

async function handleSubmit() {
  if (!isValid.value || submitting.value) return

  submitting.value = true
  try {
    await createTask(Number(props.menteeId), {
      title: form.title.trim(),
      date: form.date,
      subject: subjectToEnum[form.subject],
      description: form.description.trim() || null,
      goalId: form.goalId || null,
    })
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
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  padding: 32px;
  width: 420px;
  max-height: 80vh;
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

.form-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: none;
  background: #f5f5f5;
  font-size: 14px;
  outline: none;
  color: #333;
}

.form-select {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e5e5ea;
  background: #fff;
  font-size: 14px;
  outline: none;
  color: #333;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: none;
  background: #f5f5f5;
  font-size: 14px;
  outline: none;
  resize: none;
  line-height: 1.6;
  color: #333;
}

.form-textarea::placeholder,
.form-input::placeholder {
  color: #bbb;
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
  transition: all 0.15s;
}

.subject-btn.active {
  background: #0ca5fe;
  color: #fff;
  border-color: #0ca5fe;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.cancel-btn {
  flex: 1;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #e5e5ea;
  background: #fff;
  font-size: 15px;
  font-weight: 600;
  color: #8e8e93;
  cursor: pointer;
}

.submit-btn {
  flex: 1;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: #0ca5fe;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
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
