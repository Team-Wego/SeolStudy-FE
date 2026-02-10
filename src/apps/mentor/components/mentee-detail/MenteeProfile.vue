<template>
  <div class="profile-sidebar">
    <!-- 학생 프로필 카드 -->
    <div class="profile-card">
      <div class="profile-top">
        <img
          v-if="menteeInfo?.profileUrl"
          :src="menteeInfo.profileUrl"
          class="profile-img"
          alt="프로필"
        />
        <div v-else class="profile-placeholder">
          <User :size="36" color="#999" />
        </div>
        <div class="profile-info">
          <span class="mentee-name">{{ menteeInfo?.name || '' }}</span>
          <span class="mentee-grade">{{ formatGrade(menteeInfo?.grade) }}</span>
        </div>
      </div>
      <div class="profile-meta">
        <div class="meta-row">
          <span class="meta-label">담당 기간</span>
          <span class="meta-value">{{ formatPeriod(menteeInfo?.startedAt, menteeInfo?.endedAt) }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">목표 대학교</span>
          <span class="meta-value">{{ menteeInfo?.goalUniversity || '-' }}</span>
        </div>
      </div>
    </div>

    <!-- 목표 섹션 -->
    <div class="section-card">
      <h3 class="section-title">목표 🎯</h3>
      <div class="goal-list">
        <div v-for="goal in sortedGoals" :key="goal.goalId" class="goal-item">
          <SubjectTag
            v-if="subjectTagMap[goal.subject]"
            :subject="subjectTagMap[goal.subject]"
            size="sm"
          />
          <span v-else class="subject-tag-etc">{{ subjectNameMap[goal.subject] || goal.subject }}</span>
          <span class="goal-name">{{ goal.name }}</span>
          <button
            v-if="goal.worksheetFiles?.length"
            class="worksheet-clip-btn"
            @click.stop="openWorksheetFile(goal.worksheetFiles[0].url)"
          >
            <Paperclip :size="14" color="#5bb8f6" />
          </button>
          <span class="creator-badge" :class="goal.creatorId === currentMentorId ? 'mentor' : 'mentee'">
            {{ goal.creatorId === currentMentorId ? '멘토' : '멘티' }}
          </span>
        </div>
        <div v-if="goals.length === 0 && !goalsLoading" class="empty-text">
          등록된 목표가 없습니다
        </div>
      </div>

      <!-- 목표 추가 -->
      <div v-if="showGoalForm" class="goal-form">
        <div class="goal-form-subjects">
          <button
            v-for="subj in subjectOptions"
            :key="subj.value"
            class="subject-btn"
            :class="{ active: newGoal.subject === subj.value }"
            @click="newGoal.subject = subj.value"
          >
            {{ subj.label }}
          </button>
        </div>
        <input
          v-model="newGoal.name"
          type="text"
          class="goal-input"
          placeholder="목표를 입력해주세요"
        />
        <div class="goal-file-row">
          <input ref="goalFileInputRef" type="file" hidden @change="handleGoalFileSelect" />
          <button class="goal-file-btn" @click="goalFileInputRef?.click()">
            <Paperclip :size="14" /> 학습지 첨부
          </button>
          <div v-if="newGoal.file" class="goal-file-preview">
            <span class="goal-file-name">{{ newGoal.file.name }}</span>
            <button class="goal-file-remove" @click="newGoal.file = null">
              <X :size="12" />
            </button>
          </div>
        </div>
        <div class="goal-form-actions">
          <button class="goal-cancel-btn" @click="cancelGoalForm">취소</button>
          <button
            class="goal-submit-btn"
            :disabled="!newGoal.name.trim() || !newGoal.subject"
            @click="handleCreateGoal"
          >
            등록
          </button>
        </div>
      </div>

      <button v-else class="add-goal-btn" @click="showGoalForm = true">
        <span>목표 추가하기</span>
        <Plus :size="16" color="#999" />
      </button>
    </div>

    <!-- 메모 섹션 -->
    <div class="section-card">
      <h3 class="section-title">MEMO 📌</h3>
      <textarea
        v-model="memoContent"
        class="memo-textarea"
        placeholder="이 학생에 대한 메모를 작성해주세요."
        @blur="handleSaveMemo"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { User, Plus, Paperclip, X } from 'lucide-vue-next'
import SubjectTag from '@/components/common/SubjectTag.vue'
import { getGoals, createGoal } from '@/api/mentoring/goalApi'
import { getMemo, saveMemo } from '@/api/mentoring/mentoringApi'
import { getCookie } from '@/utils/cookie'

const props = defineProps({
  menteeId: { type: [Number, String], required: true },
  menteeInfo: { type: Object, default: null },
})

const gradeMap = {
  HIGH_1: '고등학교 1학년',
  HIGH_2: '고등학교 2학년',
  HIGH_3: '고등학교 3학년',
  N_STUDENT: 'N수생',
}

const subjectTagMap = { KOR: 'korean', ENG: 'english', MATH: 'math' }
const subjectNameMap = { KOR: '국어', ENG: '영어', MATH: '수학', ETC: '기타' }
const subjectOptions = [
  { label: '국어', value: 'KOR' },
  { label: '영어', value: 'ENG' },
  { label: '수학', value: 'MATH' },
]

const goals = ref([])
const goalsLoading = ref(false)
const currentMentorId = ref(Number(getCookie('memberId')))
const showGoalForm = ref(false)
const newGoal = reactive({ name: '', subject: null, file: null })
const goalFileInputRef = ref(null)

const sortedGoals = computed(() => {
  return [...goals.value].sort((a, b) => {
    const aIsMentor = a.creatorId === currentMentorId.value ? 0 : 1
    const bIsMentor = b.creatorId === currentMentorId.value ? 0 : 1
    return aIsMentor - bIsMentor
  })
})

const memoContent = ref('')
const memoSaved = ref('')

function formatGrade(grade) {
  return gradeMap[grade] || grade || '-'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`
}

function formatPeriod(start, end) {
  const s = formatDate(start)
  const e = formatDate(end)
  if (!s && !e) return '-'
  return `${s} ~ ${e}`
}

function cancelGoalForm() {
  showGoalForm.value = false
  newGoal.name = ''
  newGoal.subject = null
  newGoal.file = null
}

function handleGoalFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) newGoal.file = file
  e.target.value = ''
}

function openWorksheetFile(url) {
  window.open(url, '_blank')
}

async function handleCreateGoal() {
  if (!newGoal.name.trim() || !newGoal.subject) return
  try {
    await createGoal(Number(props.menteeId), newGoal.name.trim(), newGoal.subject, newGoal.file)
    cancelGoalForm()
    await fetchGoals()
  } catch (e) {
    console.error('목표 생성 실패:', e)
  }
}

async function handleSaveMemo() {
  if (memoContent.value === memoSaved.value) return
  try {
    await saveMemo(Number(props.menteeId), memoContent.value)
    memoSaved.value = memoContent.value
  } catch (e) {
    console.error('메모 저장 실패:', e)
  }
}

async function fetchGoals() {
  goalsLoading.value = true
  try {
    const { data } = await getGoals(Number(props.menteeId))
    goals.value = data || []
  } catch (e) {
    console.error('목표 조회 실패:', e)
  } finally {
    goalsLoading.value = false
  }
}

async function fetchMemo() {
  try {
    const { data } = await getMemo(Number(props.menteeId))
    memoContent.value = data?.memo || ''
    memoSaved.value = memoContent.value
  } catch (e) {
    console.error('메모 조회 실패:', e)
  }
}

watch(() => props.menteeId, () => {
  fetchGoals()
  fetchMemo()
})

onMounted(() => {
  fetchGoals()
  fetchMemo()
})
</script>

<style scoped>
.profile-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 프로필 카드 */
.profile-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.profile-img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mentee-name {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
}

.mentee-grade {
  font-size: 13px;
  font-weight: 600;
  color: #3aafe0;
}

.profile-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-row {
  display: flex;
  gap: 12px;
  align-items: baseline;
}

.meta-label {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  min-width: 60px;
}

.meta-value {
  font-size: 13px;
  color: #333;
  font-weight: 500;
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

/* 목표 리스트 */
.goal-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.goal-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subject-tag-etc {
  font-size: 10px;
  font-weight: 500;
  padding: 4px 6px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #6b7280;
}

.goal-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.creator-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.creator-badge.mentor {
  background: #eef3ff;
  color: #4a6cf7;
}

.creator-badge.mentee {
  background: #e8f5e9;
  color: #2e7d32;
}

.worksheet-clip-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.15s;
}

.worksheet-clip-btn:hover {
  opacity: 1;
}

.empty-text {
  font-size: 13px;
  color: #999;
}

/* 목표 추가 폼 */
.goal-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.goal-form-subjects {
  display: flex;
  gap: 6px;
}

.subject-btn {
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid #e5e5ea;
  background: #fff;
  font-size: 12px;
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

.goal-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: none;
  background: #f5f5f5;
  font-size: 13px;
  outline: none;
}

.goal-file-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.goal-file-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px dashed #ccc;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  flex-shrink: 0;
}

.goal-file-btn:hover {
  border-color: #999;
}

.goal-file-preview {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 11px;
  color: #555;
  min-width: 0;
}

.goal-file-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goal-file-remove {
  background: none;
  border: none;
  cursor: pointer;
  padding: 1px;
  color: #999;
  display: flex;
  align-items: center;
}

.goal-file-remove:hover {
  color: #f44336;
}

.goal-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.goal-cancel-btn {
  padding: 6px 14px;
  border-radius: 10px;
  border: 1px solid #e5e5ea;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #8e8e93;
  cursor: pointer;
}

.goal-submit-btn {
  padding: 6px 14px;
  border-radius: 10px;
  border: none;
  background: #333;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
}

.goal-submit-btn:disabled {
  background: #d1d1d6;
  cursor: not-allowed;
}

.add-goal-btn {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #999;
  padding: 4px 0;
}

/* 메모 */
.memo-textarea {
  width: 100%;
  min-height: 160px;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: #f5f5f5;
  font-size: 13px;
  line-height: 1.7;
  outline: none;
  resize: none;
  color: #333;
}

.memo-textarea::placeholder {
  color: #bbb;
}
</style>
