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
            <SubjectTag
              v-if="subjectTagMap[task.subject]"
              :subject="subjectTagMap[task.subject]"
              size="sm"
            />
            <span v-else class="subject-tag-etc">{{ subjectNameMap[task.subject] || task.subject }}</span>
            <div class="task-info">
              <span class="task-goal">{{ task.goalName || '' }}</span>
              <span class="task-title">{{ task.title }}</span>
            </div>
            <span class="task-time">{{ formatTaskTime(task.totalMinutes) }}</span>
            <StatusBadge
              :type="task.isChecked ? 'complete' : 'incomplete'"
              size="sm"
            />
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
        <h3 class="section-title">코멘트 /질문 🧑‍🎓</h3>
        <div v-if="plannerComment" class="student-comment">
          <p>{{ plannerComment.comment }}</p>
        </div>
        <div v-else class="empty-text">학생이 작성한 코멘트가 없습니다.</div>

        <!-- 기존 플래너 피드백 표시 -->
        <div v-if="existingPlannerFeedback" class="existing-feedback">
          <p>{{ existingPlannerFeedback.content }}</p>
        </div>

        <!-- 피드백 입력 (기존 피드백이 없을 때만) -->
        <template v-if="!existingPlannerFeedback">
          <textarea
            v-model="plannerFeedbackText"
            class="feedback-textarea"
            placeholder="플래너에 대한 격려나 피드백을 남겨주세요."
          />
          <div class="feedback-btn-row">
            <button
              class="feedback-submit-btn"
              :disabled="!plannerFeedbackText.trim() || plannerFeedbackSubmitting"
              @click="handlePlannerFeedback"
            >
              {{ plannerFeedbackSubmitting ? '등록 중...' : '피드백 등록하기' }}
            </button>
          </div>
        </template>
      </div>

      <!-- 과제 확인 및 피드백 -->
      <div class="section-card">
        <div class="section-title-row">
          <h3 class="section-title">과제 확인 및 피드백 ✅</h3>
          <span v-if="submittedAt" class="submitted-time">{{ submittedAt }}</span>
        </div>

        <div v-if="taskDetails.length === 0" class="empty-text">
          제출된 과제가 없습니다.
        </div>

        <div v-for="detail in taskDetails" :key="detail.id" class="task-detail-card">
          <h4 class="task-detail-title">{{ detail.title }}</h4>

          <div class="task-detail-content">
            <!-- 이미지 -->
            <div v-if="detail.images?.length" class="task-images">
              <img
                v-for="img in detail.images"
                :key="img.id"
                :src="img.url"
                class="task-image"
                @click="previewImage(img.url)"
              />
            </div>
            <div v-else class="image-placeholder">
              <ImageIcon :size="32" color="#ccc" />
            </div>

            <!-- 피드백 영역 -->
            <div class="task-feedback-area">
              <!-- 기존 피드백 표시 -->
              <div v-if="detail.existingFeedback" class="existing-feedback">
                <p>{{ detail.existingFeedback.content }}</p>
              </div>

              <!-- 피드백 입력 (기존 피드백이 없을 때만) -->
              <template v-if="!detail.existingFeedback">
                <textarea
                  v-model="detail.feedbackText"
                  class="feedback-textarea"
                  placeholder="학생의 질문에 대한 답변과 상세 피드백을 작성해주세요."
                />
                <div class="feedback-btn-row">
                  <button
                    class="task-feedback-btn"
                    :disabled="!detail.feedbackText?.trim() || detail.submitting"
                    @click="handleTaskFeedback(detail)"
                  >
                    {{ detail.submitting ? '전송 중...' : '전송하기' }}
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ChevronLeft, ChevronRight, Clock, ImageIcon } from 'lucide-vue-next'
import SubjectTag from '@/components/common/SubjectTag.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { getDailyTasks, getPlannerComment, getStudyTime, getTaskDetail } from '@/api/task/taskApi'
import { getFeedbacks, createFeedback } from '@/api/feedback/feedbackApi'
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

function previewImage(url) {
  if (url) window.open(url, '_blank')
}

async function handlePlannerFeedback() {
  if (!plannerFeedbackText.value.trim() || plannerFeedbackSubmitting.value) return
  plannerFeedbackSubmitting.value = true
  try {
    await createFeedback({
      menteeId: Number(props.menteeId),
      type: 'PLANNER',
      content: plannerFeedbackText.value.trim(),
      targetDate: dateParam.value,
    })
    existingPlannerFeedback.value = { content: plannerFeedbackText.value.trim() }
    plannerFeedbackText.value = ''
  } catch (e) {
    console.error('플래너 피드백 등록 실패:', e)
  } finally {
    plannerFeedbackSubmitting.value = false
  }
}

async function handleTaskFeedback(detail) {
  if (!detail.feedbackText?.trim() || detail.submitting) return
  detail.submitting = true
  try {
    await createFeedback({
      menteeId: Number(props.menteeId),
      type: 'TASK',
      taskId: detail.id,
      content: detail.feedbackText.trim(),
      targetDate: dateParam.value,
    })
    detail.existingFeedback = { content: detail.feedbackText.trim() }
    detail.feedbackText = ''
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
      const fbDate = f.createdAt?.substring(0, 10)
      return fbDate === date
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
  font-size: 16px;
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
  border-bottom: 1px solid #f3f4f6;
}

.task-detail-card:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.task-detail-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 14px;
}

.task-detail-content {
  display: flex;
  gap: 16px;
}

.task-images {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  width: 180px;
}

.task-image {
  width: 180px;
  height: 140px;
  object-fit: cover;
  border-radius: 12px;
  cursor: pointer;
}

.image-placeholder {
  width: 180px;
  height: 140px;
  background: #f5f5f5;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.task-feedback-area {
  flex: 1;
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

/* 공통 */
.loading-text,
.empty-text {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 40px 0;
}
</style>
