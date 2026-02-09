<template>
  <div class="daily-mentoring">
    <!-- 날짜 헤더 -->
    <div class="date-header">
      <button class="date-nav-btn" @click="changeDate(-1)">
        <ChevronLeft :size="20" color="#1A1A1A" />
      </button>
      <h2 class="date-title">{{ formattedDate }}</h2>
      <button class="date-nav-btn" @click="changeDate(1)">
        <ChevronRight :size="20" color="#1A1A1A" />
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading-text">불러오는 중...</div>

    <template v-else>
      <!-- 태스크 목록 + 총 공부시간 -->
      <div class="task-and-time">
        <!-- 태스크 목록 -->
        <div class="task-list-section">
          <div v-if="tasks.length === 0" class="empty-text">
            오늘 등록된 과제가 없습니다.
          </div>
          <div v-for="task in tasks" :key="task.id" class="task-row">
            <SubjectTag v-if="subjectTagMap[task.subject]" :subject="subjectTagMap[task.subject]" size="sm" />
            <span v-else class="subject-tag-etc">{{ subjectNameMap[task.subject] || task.subject }}</span>
            <div class="task-info">
              <span class="task-goal">{{ task.goalName || '' }}</span>
              <span class="task-title">{{ task.title }}</span>
            </div>
            <span class="task-time">{{ formatTaskTime(task.totalMinutes) }}</span>
            <StatusBadge :type="task.isChecked ? 'complete' : 'incomplete'" size="sm" />
          </div>
        </div>

        <!-- 총 공부 시간 -->
        <div class="study-time-card">
          <span class="study-time-label">총 공부 시간</span>
          <span class="study-time-value">{{ formattedTotalStudyTime }}</span>
          <Clock :size="48" color="#d1d1d6" class="study-time-icon" />
        </div>
      </div>

      <!-- 코멘트/질문 섹션 -->
      <div class="section-card">
        <h3 class="section-title">플래너 코멘트 & 피드백 남기기</h3>
        <div v-if="plannerComment" class="student-comment">
          <p>{{ plannerComment.comment }}</p>
        </div>
        <div v-else class="empty-text">학생이 작성한 코멘트가 없습니다.</div>

        <!-- 기존 플래너 피드백 표시 -->
        <div v-if="existingPlannerFeedback && !plannerEditing" class="existing-feedback">
          <p v-html="renderHighlightedText(existingPlannerFeedback.content, existingPlannerFeedback.highlight)"></p>
          <div v-if="existingPlannerFeedback.feedbackImages?.length" class="feedback-images">
            <img
              v-for="(img, idx) in existingPlannerFeedback.feedbackImages"
              :key="img.imageId"
              :src="img.imageUrl"
              class="feedback-image"
              @click="openPreview(existingPlannerFeedback.feedbackImages.map(i => i.imageUrl), idx)"
            />
          </div>
          <div class="feedback-actions">
            <button class="feedback-action-btn" @click="startPlannerEdit">
              <Pencil :size="14" /> 수정
            </button>
            <button class="feedback-action-btn delete" @click="handlePlannerDelete">
              <Trash2 :size="14" /> 삭제
            </button>
          </div>
        </div>

        <!-- 피드백 입력 / 수정 -->
        <template v-if="!existingPlannerFeedback || plannerEditing">
          <textarea ref="plannerTextareaRef" v-model="plannerFeedbackText" class="feedback-textarea"
            placeholder="플래너에 대한 격려나 피드백을 남겨주세요." />
          <div v-if="plannerHighlight" class="highlight-preview">
            <Highlighter :size="12" color="#f9a825" />
            <span class="highlight-preview-text">{{ plannerHighlight }}</span>
            <button class="highlight-remove-btn" @click="plannerHighlight = ''">
              <X :size="12" />
            </button>
          </div>
          <!-- 첨부 파일 미리보기 -->
          <div v-if="plannerFiles.length > 0" class="attached-files">
            <div v-for="(file, idx) in plannerFiles" :key="idx" class="attached-file">
              <Paperclip :size="12" color="#999" />
              <span class="attached-file-name">{{ file.name }}</span>
              <button class="attached-file-remove" @click="removePlannerFile(idx)">
                <X :size="12" />
              </button>
            </div>
          </div>
          <div class="feedback-btn-row">
            <button class="highlight-btn" @click="applyPlannerHighlight">
              <Highlighter :size="16" /> 형광펜
            </button>
            <input ref="plannerFileInputRef" type="file" accept="image/*" multiple hidden
              @change="handlePlannerFileSelect" />
            <button class="attach-btn" @click="plannerFileInputRef?.click()">
              <Paperclip :size="16" /> 사진 첨부
            </button>
            <button v-if="plannerEditing" class="feedback-cancel-btn" @click="cancelPlannerEdit">
              취소
            </button>
            <button class="feedback-submit-btn" :disabled="!plannerFeedbackText.trim() || plannerFeedbackSubmitting"
              @click="plannerEditing ? handlePlannerUpdate() : handlePlannerFeedback()">
              {{ plannerFeedbackSubmitting ? '처리 중...' : (plannerEditing ? '수정 완료' : '피드백 등록하기') }}
            </button>
          </div>
        </template>
      </div>

      <!-- 과제 확인 및 피드백 -->
      <div class="section-card">
        <div class="section-title-row">
          <h3 class="section-title">과제 확인 및 피드백</h3>
          <span v-if="submittedAt" class="submitted-time">{{ submittedAt }}</span>
        </div>

        <div v-if="taskDetails.length === 0" class="empty-text">
          제출된 과제가 없습니다.
        </div>

        <div v-for="detail in taskDetails" :key="detail.id" class="task-detail-card">
          <!-- 제목 + 인증 상태 -->
          <div class="task-detail-header">
            <h4 class="task-detail-title">{{ detail.title }}</h4>
            <span class="verification-badge" :class="detail.submittedAt ? 'verified' : 'unverified'">
              {{ detail.submittedAt ? '인증 완료' : '미인증' }}
            </span>
          </div>

          <!-- 학습지 파일 -->
          <div v-if="detail.worksheetFiles?.length" class="worksheet-section">
            <h5 class="sub-section-title">학습지</h5>
            <div class="worksheet-list">
              <a v-for="file in detail.worksheetFiles" :key="file.id" :href="file.url" target="_blank"
                class="worksheet-item">
                <FileText :size="16" color="#5bb8f6" />
                <span class="worksheet-name">{{ file.name }}</span>
                <span class="worksheet-size">{{ formatFileSize(file.size) }}</span>
                <Download :size="14" color="#999" />
              </a>
            </div>
          </div>

          <!-- 과제 인증 (학생 제출) -->
          <div class="submission-section">
            <h5 class="sub-section-title">과제 인증</h5>
            <div v-if="detail.images?.length || detail.comment" class="submission-content">
              <div v-if="detail.images?.length" class="task-images">
                <img v-for="(img, idx) in detail.images" :key="img.id" :src="img.url" class="task-image"
                  @click="openPreview(detail.images.map(i => i.url), idx)" />
              </div>
              <div v-if="detail.comment" class="student-task-comment">
                <p>{{ detail.comment }}</p>
              </div>
            </div>
            <div v-else class="empty-text small">과제 인증이 없습니다.</div>
          </div>

          <!-- 멘토 피드백 -->
          <div class="task-feedback-area">
            <h5 class="sub-section-title">멘토 피드백</h5>
            <!-- 기존 피드백 표시 -->
            <div v-if="detail.existingFeedback && !detail.editing" class="existing-feedback">
              <p v-html="renderHighlightedText(detail.existingFeedback.content, detail.existingFeedback.highlight)"></p>
              <div v-if="detail.existingFeedback.feedbackImages?.length" class="feedback-images">
                <img
                  v-for="(img, idx) in detail.existingFeedback.feedbackImages"
                  :key="img.imageId"
                  :src="img.imageUrl"
                  class="feedback-image"
                  @click="openPreview(detail.existingFeedback.feedbackImages.map(i => i.imageUrl), idx)"
                />
              </div>
              <div class="feedback-actions">
                <button class="feedback-action-btn" @click="startTaskEdit(detail)">
                  <Pencil :size="14" /> 수정
                </button>
                <button class="feedback-action-btn delete" @click="handleTaskDelete(detail)">
                  <Trash2 :size="14" /> 삭제
                </button>
              </div>
            </div>

            <!-- 피드백 입력 / 수정 -->
            <template v-if="!detail.existingFeedback || detail.editing">
              <textarea :ref="el => setTaskTextareaRef(el, detail.id)" v-model="detail.feedbackText"
                class="feedback-textarea" placeholder="학생의 질문에 대한 답변과 상세 피드백을 작성해주세요." />
              <div v-if="detail.highlight" class="highlight-preview">
                <Highlighter :size="12" color="#f9a825" />
                <span class="highlight-preview-text">{{ detail.highlight }}</span>
                <button class="highlight-remove-btn" @click="detail.highlight = ''">
                  <X :size="12" />
                </button>
              </div>
              <!-- 첨부 파일 미리보기 -->
              <div v-if="detail.files?.length > 0" class="attached-files">
                <div v-for="(file, idx) in detail.files" :key="idx" class="attached-file">
                  <Paperclip :size="12" color="#999" />
                  <span class="attached-file-name">{{ file.name }}</span>
                  <button class="attached-file-remove" @click="removeTaskFile(detail, idx)">
                    <X :size="12" />
                  </button>
                </div>
              </div>
              <div class="feedback-btn-row">
                <button class="highlight-btn" @click="applyTaskHighlight(detail)">
                  <Highlighter :size="16" /> 형광펜
                </button>
                <input :ref="el => setTaskFileInputRef(el, detail.id)" type="file" accept="image/*" multiple hidden
                  @change="handleTaskFileSelect(detail, $event)" />
                <button class="attach-btn" @click="taskFileInputRefs[detail.id]?.click()">
                  <Paperclip :size="16" /> 사진 첨부
                </button>
                <button v-if="detail.editing" class="feedback-cancel-btn" @click="cancelTaskEdit(detail)">
                  취소
                </button>
                <button class="task-feedback-btn" :disabled="!detail.feedbackText?.trim() || detail.submitting"
                  @click="detail.editing ? handleTaskUpdate(detail) : handleTaskFeedback(detail)">
                  {{ detail.submitting ? '처리 중...' : (detail.editing ? '수정 완료' : '전송하기') }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>

    <!-- 이미지 미리보기 모달 -->
    <Teleport to="body">
      <div v-if="previewModal.show" class="image-preview-overlay" @click.self="closePreview">
        <button class="preview-close-btn" @click="closePreview">
          <X :size="24" />
        </button>
        <button v-if="previewModal.images.length > 1" class="preview-nav-btn prev" @click="prevPreviewImage">
          <ChevronLeft :size="28" />
        </button>
        <div class="preview-image-wrapper">
          <img :src="previewModal.images[previewModal.index]" class="preview-image" />
          <div v-if="previewModal.images.length > 1" class="preview-counter">
            {{ previewModal.index + 1 }} / {{ previewModal.images.length }}
          </div>
        </div>
        <button v-if="previewModal.images.length > 1" class="preview-nav-btn next" @click="nextPreviewImage">
          <ChevronRight :size="28" />
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ChevronLeft, ChevronRight, Clock, Highlighter, X, Pencil, Trash2, FileText, Download, Paperclip } from 'lucide-vue-next'
import SubjectTag from '@/components/common/SubjectTag.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { getDailyTasks, getPlannerComment, getStudyTime, getTaskDetail } from '@/api/task/taskApi'
import { getFeedbacks, createFeedback, updateFeedback, deleteFeedback } from '@/api/feedback/feedbackApi'
import { format, addDays, getDay } from 'date-fns'

const props = defineProps({
  menteeId: { type: [Number, String], required: true },
})

const currentDate = ref(new Date())
const loading = ref(true)
const tasks = ref([])
const plannerComment = ref(null)
const studyTimeData = ref(null)
const taskDetails = ref([])
const submittedAt = ref('')

const existingPlannerFeedback = ref(null)
const plannerFeedbackText = ref('')
const plannerFeedbackSubmitting = ref(false)
const plannerHighlight = ref('')
const plannerEditing = ref(false)
const plannerFiles = ref([])
const plannerFileInputRef = ref(null)
const plannerTextareaRef = ref(null)
const taskTextareaRefs = {}
const taskFileInputRefs = {}

function setTaskTextareaRef(el, id) {
  if (el) taskTextareaRefs[id] = el
}

function setTaskFileInputRef(el, id) {
  if (el) taskFileInputRefs[id] = el
}

function handlePlannerFileSelect(event) {
  const files = Array.from(event.target.files || [])
  plannerFiles.value = [...plannerFiles.value, ...files]
  event.target.value = ''
}

function removePlannerFile(index) {
  plannerFiles.value.splice(index, 1)
}

function handleTaskFileSelect(detail, event) {
  const files = Array.from(event.target.files || [])
  detail.files = [...(detail.files || []), ...files]
  event.target.value = ''
}

function removeTaskFile(detail, index) {
  detail.files.splice(index, 1)
}

// 형광펜 버튼 클릭: textarea에서 현재 선택된 텍스트를 highlight로 지정
function applyPlannerHighlight() {
  const el = plannerTextareaRef.value
  if (!el) return
  const selected = el.value.substring(el.selectionStart, el.selectionEnd).trim()
  if (selected) {
    plannerHighlight.value = selected
  } else {
    alert('형광펜을 적용할 텍스트를 먼저 드래그로 선택해주세요.')
  }
}

function applyTaskHighlight(detail) {
  const el = taskTextareaRefs[detail.id]
  if (!el) return
  const selected = el.value.substring(el.selectionStart, el.selectionEnd).trim()
  if (selected) {
    detail.highlight = selected
  } else {
    alert('형광펜을 적용할 텍스트를 먼저 드래그로 선택해주세요.')
  }
}

const dayNames = ['일', '월', '화', '수', '목', '금', '토']
const subjectTagMap = { KOR: 'korean', ENG: 'english', MATH: 'math' }
const subjectNameMap = { KOR: '국어', ENG: '영어', MATH: '수학', ETC: '기타' }

const formattedDate = computed(() => {
  const d = currentDate.value
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const date = d.getDate()
  const dayName = dayNames[getDay(d)]
  return `${year}. ${month}. ${date} ${dayName}`
})

const dateParam = computed(() => format(currentDate.value, 'yyyy-MM-dd'))

const formattedTotalStudyTime = computed(() => {
  if (!studyTimeData.value?.totalMinutes) return '0h 0min'
  const total = studyTimeData.value.totalMinutes
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h}h ${m}min`
})

function formatTaskTime(min) {
  if (!min) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  const s = 0
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function changeDate(offset) {
  currentDate.value = addDays(currentDate.value, offset)
}

const previewModal = ref({ show: false, images: [], index: 0 })

function openPreview(images, index) {
  previewModal.value = { show: true, images, index }
}

function closePreview() {
  previewModal.value.show = false
}

function prevPreviewImage() {
  const m = previewModal.value
  m.index = (m.index - 1 + m.images.length) % m.images.length
}

function nextPreviewImage() {
  const m = previewModal.value
  m.index = (m.index + 1) % m.images.length
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function renderHighlightedText(content, highlight) {
  if (!content) return ''
  const escaped = escapeHtml(content)
  if (!highlight) return escaped
  const escapedHighlight = escapeHtml(highlight)
  return escaped.split(escapedHighlight).join(`<span class="highlight-mark">${escapedHighlight}</span>`)
}

function formatFileSize(sizeMB) {
  if (!sizeMB) return ''
  if (sizeMB < 1) return `${Math.round(sizeMB * 1024)}KB`
  return `${sizeMB.toFixed(1)}MB`
}

async function handlePlannerFeedback() {
  if (!plannerFeedbackText.value.trim() || plannerFeedbackSubmitting.value) return
  plannerFeedbackSubmitting.value = true
  try {
    const data = {
      menteeId: Number(props.menteeId),
      type: 'PLANNER',
      content: plannerFeedbackText.value.trim(),
      targetDate: dateParam.value,
    }
    if (plannerHighlight.value) data.highlight = plannerHighlight.value
    await createFeedback(data, plannerFiles.value.length > 0 ? plannerFiles.value : undefined)
    existingPlannerFeedback.value = { content: plannerFeedbackText.value.trim() }
    plannerFeedbackText.value = ''
    plannerHighlight.value = ''
    plannerFiles.value = []
  } catch (e) {
    console.error('플래너 피드백 등록 실패:', e)
  } finally {
    plannerFeedbackSubmitting.value = false
  }
}

function startPlannerEdit() {
  plannerFeedbackText.value = existingPlannerFeedback.value.content
  plannerHighlight.value = existingPlannerFeedback.value.highlight || ''
  plannerEditing.value = true
}

function cancelPlannerEdit() {
  plannerFeedbackText.value = ''
  plannerHighlight.value = ''
  plannerEditing.value = false
}

async function handlePlannerUpdate() {
  if (!plannerFeedbackText.value.trim() || plannerFeedbackSubmitting.value) return
  plannerFeedbackSubmitting.value = true
  try {
    const data = {
      content: plannerFeedbackText.value.trim(),
      highlight: plannerHighlight.value || null,
      imageChanged: false,
    }
    await updateFeedback(existingPlannerFeedback.value.feedbackId, data)
    existingPlannerFeedback.value = {
      ...existingPlannerFeedback.value,
      content: data.content,
      highlight: data.highlight,
    }
    plannerFeedbackText.value = ''
    plannerHighlight.value = ''
    plannerEditing.value = false
  } catch (e) {
    console.error('플래너 피드백 수정 실패:', e)
  } finally {
    plannerFeedbackSubmitting.value = false
  }
}

async function handlePlannerDelete() {
  if (!confirm('피드백을 삭제하시겠습니까?')) return
  try {
    await deleteFeedback(existingPlannerFeedback.value.feedbackId)
    existingPlannerFeedback.value = null
    plannerFeedbackText.value = ''
    plannerHighlight.value = ''
    plannerEditing.value = false
  } catch (e) {
    console.error('플래너 피드백 삭제 실패:', e)
  }
}

function startTaskEdit(detail) {
  detail.feedbackText = detail.existingFeedback.content
  detail.highlight = detail.existingFeedback.highlight || ''
  detail.editing = true
}

function cancelTaskEdit(detail) {
  detail.feedbackText = ''
  detail.highlight = ''
  detail.editing = false
}

async function handleTaskUpdate(detail) {
  if (!detail.feedbackText?.trim() || detail.submitting) return
  detail.submitting = true
  try {
    const data = {
      content: detail.feedbackText.trim(),
      highlight: detail.highlight || null,
      imageChanged: false,
    }
    await updateFeedback(detail.existingFeedback.feedbackId, data)
    detail.existingFeedback = {
      ...detail.existingFeedback,
      content: data.content,
      highlight: data.highlight,
    }
    detail.feedbackText = ''
    detail.highlight = ''
    detail.editing = false
  } catch (e) {
    console.error('과제 피드백 수정 실패:', e)
  } finally {
    detail.submitting = false
  }
}

async function handleTaskDelete(detail) {
  if (!confirm('피드백을 삭제하시겠습니까?')) return
  try {
    await deleteFeedback(detail.existingFeedback.feedbackId)
    detail.existingFeedback = null
    detail.feedbackText = ''
    detail.highlight = ''
    detail.editing = false
  } catch (e) {
    console.error('과제 피드백 삭제 실패:', e)
  }
}

async function handleTaskFeedback(detail) {
  if (!detail.feedbackText?.trim() || detail.submitting) return
  detail.submitting = true
  try {
    const data = {
      menteeId: Number(props.menteeId),
      type: 'TASK',
      taskId: detail.id,
      content: detail.feedbackText.trim(),
      targetDate: dateParam.value,
    }
    if (detail.highlight) data.highlight = detail.highlight
    const files = detail.files?.length > 0 ? detail.files : undefined
    await createFeedback(data, files)
    detail.existingFeedback = { content: detail.feedbackText.trim() }
    detail.feedbackText = ''
    detail.highlight = ''
    detail.files = []
  } catch (e) {
    console.error('과제 피드백 등록 실패:', e)
  } finally {
    detail.submitting = false
  }
}

async function fetchData() {
  loading.value = true
  try {
    const menteeId = Number(props.menteeId)
    const date = dateParam.value

    const [tasksRes, commentRes, studyTimeRes, plannerFbRes, taskFbRes] = await Promise.all([
      getDailyTasks(menteeId, date),
      getPlannerComment(menteeId, date).catch(() => null),
      getStudyTime(menteeId, date).catch(() => null),
      getFeedbacks(menteeId, 'PLANNER').catch(() => ({ data: [] })),
      getFeedbacks(menteeId, 'TASK').catch(() => ({ data: [] })),
    ])

    tasks.value = tasksRes.data || []
    plannerComment.value = commentRes?.data || null
    studyTimeData.value = studyTimeRes?.data || null

    // 해당 날짜의 플래너 피드백 찾기
    const plannerFbList = plannerFbRes?.data || []
    existingPlannerFeedback.value = plannerFbList.find((f) => {
      return f.targetDate === date
    }) || null
    plannerFeedbackText.value = ''

    // 해당 날짜의 과제 피드백 목록
    const taskFbList = taskFbRes?.data || []

    // 제출 시간 계산
    if (plannerComment.value?.createdAt) {
      const d = new Date(plannerComment.value.createdAt)
      submittedAt.value = `오늘 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} 제출됨`
    } else {
      submittedAt.value = ''
    }

    // 과제 상세 로드 + 기존 피드백 매칭
    const detailPromises = tasks.value.map(async (task) => {
      try {
        const { data } = await getTaskDetail(task.id)
        // 해당 과제에 대한 기존 피드백 찾기
        const matched = taskFbList.find((f) => f.taskId === task.id)
        return {
          ...data,
          existingFeedback: matched || null,
          feedbackText: '',
          highlight: '',
          files: [],
          showHighlightBtn: false,
          submitting: false,
          editing: false,
        }
      } catch {
        return {
          ...task,
          images: [],
          comment: '',
          existingFeedback: null,
          feedbackText: '',
          highlight: '',
          files: [],
          showHighlightBtn: false,
          submitting: false,
          editing: false,
        }
      }
    })
    taskDetails.value = await Promise.all(detailPromises)
  } catch (e) {
    console.error('일일 멘토링 데이터 로드 실패:', e)
  } finally {
    loading.value = false
  }
}

watch(dateParam, () => {
  plannerFeedbackText.value = ''
  fetchData()
})

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.daily-mentoring {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 날짜 헤더 */
.date-header {
  display: flex;
  align-items: center;
  gap: 16px;
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
  margin: 0;
}

/* 태스크 + 시간 */
.task-and-time {
  display: flex;
  gap: 20px;
}

.task-list-section {
  flex: 1;
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.task-row:last-child {
  border-bottom: none;
}

.subject-tag-etc {
  font-size: 10px;
  font-weight: 500;
  padding: 4px 6px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #6b7280;
  flex-shrink: 0;
}

.task-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-goal {
  font-size: 12px;
  color: #a6a6a6;
}

.task-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-time {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  flex-shrink: 0;
}

/* 총 공부 시간 */
.study-time-card {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
}

.study-time-label {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}

.study-time-value {
  font-size: 28px;
  font-weight: 800;
  color: #1a1a1a;
}

.study-time-icon {
  position: absolute;
  bottom: 16px;
  right: 16px;
  opacity: 0.5;
}

/* 섹션 카드 */
.section-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 18px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0 0 16px;
}

.submitted-time {
  font-size: 12px;
  color: #999;
}

/* 학생 코멘트 */
.student-comment {
  background: #f6f7f9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.student-comment p {
  font-size: 14px;
  color: #3d3d3d;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}

/* 기존 피드백 표시 */
.existing-feedback {
  background: #eef8ff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  position: relative;
}

.existing-feedback p {
  font-size: 14px;
  color: #333;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}

/* 피드백 입력 */
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

.feedback-btn-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.feedback-submit-btn {
  flex: 2;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: #5bb8f6;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.feedback-submit-btn:disabled {
  background: #d1d1d6;
  cursor: not-allowed;
}

/* 과제 상세 카드 */
.task-detail-card {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #dddddd;
}

.task-detail-card:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.task-detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.task-detail-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.verification-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}

.verification-badge.verified {
  background: #e8f5e9;
  color: #2e7d32;
}

.verification-badge.unverified {
  background: #f3f4f6;
  color: #9e9e9e;
}

/* 서브 섹션 */
.sub-section-title {
  font-size: 13px;
  font-weight: 700;
  color: #666;
  margin: 0 0 8px;
}

/* 학습지 파일 */
.worksheet-section {
  margin-bottom: 16px;
}

.worksheet-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.worksheet-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  transition: background 0.15s;
}

.worksheet-item:hover {
  background: #eef3f8;
}

.worksheet-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.worksheet-size {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

/* 과제 인증 */
.submission-section {
  margin-bottom: 16px;
}

.submission-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.task-image {
  width: 140px;
  height: 110px;
  object-fit: cover;
  border-radius: 10px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.task-image:hover {
  opacity: 0.85;
}

.student-task-comment {
  background: #f6f7f9;
  border-radius: 10px;
  padding: 12px 14px;
}

.student-task-comment p {
  font-size: 13px;
  color: #3d3d3d;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

/* 멘토 피드백 */
.task-feedback-area {
  display: flex;
  flex-direction: column;
}

.task-feedback-btn {
  flex: 2;
  padding: 12px;
  border-radius: 12px;
  border: none;
  background: #5bb8f6;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.task-feedback-btn:disabled {
  background: #d1d1d6;
  cursor: not-allowed;
}

/* 하이라이트 UI */
.highlight-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  background: #fff59d;
  color: #5d4037;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}

.highlight-btn:hover {
  background: #fff176;
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
  color: #5d4037;
}

.highlight-preview-text {
  flex: 1;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.highlight-remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  color: #999;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.highlight-remove-btn:hover {
  color: #f44336;
}

/* 피드백 수정/삭제 버튼 */
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
  color: #555;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.feedback-action-btn:hover {
  background: #f5f5f5;
}

.feedback-action-btn.delete {
  color: #e53935;
  border-color: #ffcdd2;
}

.feedback-action-btn.delete:hover {
  background: #ffebee;
}

.feedback-cancel-btn {
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #666;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}

.feedback-cancel-btn:hover {
  background: #f5f5f5;
}

/* 파일 첨부 */
.attach-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #555;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}

.attach-btn:hover {
  background: #f5f5f5;
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
  color: #555;
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
  padding: 1px;
  color: #999;
  display: flex;
  align-items: center;
}

.attached-file-remove:hover {
  color: #f44336;
}

/* 피드백 이미지 */
.feedback-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.feedback-image {
  width: 140px;
  height: 110px;
  object-fit: cover;
  border-radius: 10px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.feedback-image:hover {
  opacity: 0.85;
}

/* 형광펜 렌더링 */
:deep(.highlight-mark) {
  background-color: #fff59d;
  border-radius: 2px;
  padding: 0px 1px;
  box-decoration-break: clone;
}

/* 공통 */
.loading-text,
.empty-text {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 40px 0;
}

.empty-text.small {
  padding: 16px 0;
  font-size: 13px;
}

</style>

<style>
/* 이미지 미리보기 모달 (Teleport → body이므로 scoped 불가) */
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
  padding: 8px;
  border-radius: 50%;
  transition: background 0.15s;
}

.preview-close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.preview-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 12px 8px;
  border-radius: 8px;
  transition: background 0.15s;
}

.preview-nav-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.preview-nav-btn.prev {
  left: 20px;
}

.preview-nav-btn.next {
  right: 20px;
}

.preview-image-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 85vw;
  max-height: 85vh;
}

.preview-image {
  max-width: 85vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  user-select: none;
}

.preview-counter {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 600;
}
</style>
