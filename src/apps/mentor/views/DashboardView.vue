<template>
  <div class="dashboard-page">
    <div class="dashboard-grid">
      <!-- ─── 좌측: 요약카드 + 멘토링 현황 ─── -->
      <div class="col-left">
        <!-- 요약 카드 행 (담당 멘티 | 미작성 피드백 가로 나란히) -->
        <div class="summary-row">
          <div class="summary-card">
            <img :src="peopleIcon" alt="멘티" class="summary-icon" />
            <div class="summary-text">
              <span class="summary-label">담당 멘티</span>
              <template v-if="loading">
                <div class="skeleton" style="width: 50px; height: 32px; border-radius: 8px;" />
              </template>
              <span v-else class="summary-value">{{ summary.menteeCount ?? 0 }}명</span>
            </div>
          </div>

          <div class="summary-card">
            <img :src="pencilIcon" alt="피드백" class="summary-icon" />
            <div class="summary-text">
              <span class="summary-label">미작성 피드백</span>
              <template v-if="loading">
                <div class="skeleton" style="width: 50px; height: 32px; border-radius: 8px;" />
              </template>
              <span v-else class="summary-value highlight">{{ summary.pendingFeedbackCount ?? 0 }}건</span>
            </div>
          </div>
        </div>

        <!-- 오늘의 멘토링 현황 -->
        <div class="section-card">
          <h2 class="section-title">오늘의 멘토링 현황</h2>
          <p class="section-subtitle">학생별 과제 진척도</p>

          <template v-if="loading">
            <div v-for="i in 4" :key="'prog-skel-' + i" class="progress-item">
              <div class="skeleton" style="width: 52px; height: 52px; border-radius: 50%;" />
              <div class="skeleton skeleton-text" style="width: 60px; height: 15px;" />
              <div class="progress-right">
                <div class="skeleton skeleton-text" style="width: 30px; height: 14px; align-self: flex-end;" />
                <div class="skeleton skeleton-text" style="width: 100%; height: 6px; border-radius: 3px;" />
              </div>
            </div>
          </template>

          <template v-else-if="menteeProgress.length === 0">
            <div class="empty-progress">
              <p>멘토링 현황이 없습니다.</p>
            </div>
          </template>

          <template v-else>
            <div v-for="mentee in menteeProgress" :key="mentee.menteeId" class="progress-item">
              <img v-if="mentee.profileUrl" :src="mentee.profileUrl" class="progress-avatar" alt="프로필" />
              <div v-else class="progress-avatar progress-avatar-placeholder">
                <User :size="20" color="#999" />
              </div>
              <span class="progress-name">{{ mentee.menteeName }}</span>
              <div class="progress-right">
                <span class="progress-count">{{ mentee.submittedCount ?? 0 }}/{{ mentee.assignedCount ?? 0 }}</span>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: progressPercent(mentee) + '%' }" />
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- ─── 우측: 피드백 작성 필요 리스트 ─── -->
      <div class="col-right">
        <div class="section-card feedback-section">
          <h2 class="section-title">피드백 작성 필요</h2>
          <p class="section-subtitle">학생이 제출을 완료했으나 아직 피드백을 받지 못한 과제입니다.</p>

          <template v-if="loading">
            <div v-for="i in 5" :key="'fb-skel-' + i" class="feedback-item">
              <div class="skeleton" style="width: 44px; height: 44px; border-radius: 50%;" />
              <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; gap: 8px; align-items: center;">
                  <div class="skeleton skeleton-text" style="width: 50px; height: 14px;" />
                  <div class="skeleton skeleton-text" style="width: 36px; height: 18px; border-radius: 4px;" />
                  <div class="skeleton skeleton-text" style="width: 80px; height: 12px;" />
                </div>
                <div class="skeleton skeleton-text" style="width: 180px; height: 16px;" />
                <div class="skeleton skeleton-text" style="width: 240px; height: 13px;" />
              </div>
              <div class="skeleton" style="width: 100px; height: 40px; border-radius: 50px; flex-shrink: 0;" />
            </div>
          </template>

          <template v-else-if="pendingFeedbacks.length === 0">
            <div class="empty-feedback">
              <p>작성 대기 중인 피드백이 없습니다.</p>
            </div>
          </template>

          <template v-else>
            <div v-for="fb in pendingFeedbacks" :key="fb.taskId" class="feedback-item">
              <!-- 왼쪽 아바타 -->
              <div class="feedback-avatar-wrap">
                <img v-if="fb.menteeProfileUrl" :src="fb.menteeProfileUrl" class="progress-avatar" alt="프로필" />

                <div v-else class="progress-avatar progress-avatar-placeholder">
                  <User :size="20" color="#999" />
                </div>
              </div>

              <!-- 중앙 정보 -->
              <div class="feedback-info">
                <div class="feedback-meta">
                  <span class="feedback-name">{{ fb.menteeName }}</span>
                  <SubjectTag v-if="subjectTagMap[fb.subject]" :subject="subjectTagMap[fb.subject]" size="sm" />
                  <span class="feedback-date">{{ formatFeedbackDate(fb.submittedAt) }}</span>
                </div>
                <span class="feedback-task-title">{{ fb.title }}</span>
                <p v-if="fb.comment" class="feedback-task-comment">{{ fb.comment }}</p>
              </div>

              <!-- 우측 버튼 -->
              <button class="feedback-btn" @click="goToFeedback(fb)">
                피드백 남기기
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User } from 'lucide-vue-next'
import SubjectTag from '@/components/common/SubjectTag.vue'
import { getMenteeList, getDashboardSummary, getPendingFeedbacks, getMenteeProgress } from '@/api/mentoring/mentoringApi'
import peopleIcon from '@/assets/icons/people.svg'
import pencilIcon from '@/assets/icons/pencil.svg'

const router = useRouter()
const loading = ref(true)

const summary = ref({
  menteeCount: 0,
  pendingFeedbackCount: 0,
})
const menteeProgress = ref([])
const pendingFeedbacks = ref([])

const subjectTagMap = {
  ENG: 'english',
  MATH: 'math',
  KOR: 'korean',
}

function progressPercent(mentee) {
  if (!mentee.assignedCount || mentee.submittedCount === 0) return 0
  return Math.round((mentee.submittedCount / mentee.assignedCount) * 100)
}

function formatFeedbackDate(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const period = hours < 12 ? '오늘' : '오늘'
    return `${period} ${String(hours).padStart(2, '0')}:${minutes} 제출`
  }
  if (diffDays === 1) {
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `어제 ${hours}:${minutes} 제출`
  }
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} 제출`
}

function goToFeedback(fb) {
  router.push(`/mentor/mentees/${fb.menteeId}`)
}

async function fetchDashboardData() {
  loading.value = true
  try {
    const [summaryRes, progressRes, feedbackRes] = await Promise.allSettled([
      getDashboardSummary(),
      getMenteeProgress(),
      getPendingFeedbacks(),
    ])

    if (summaryRes.status === 'fulfilled') {
      summary.value = summaryRes.value.data
    }
    if (progressRes.status === 'fulfilled') {
      menteeProgress.value = progressRes.value.data || []
    }
    if (feedbackRes.status === 'fulfilled') {
      pendingFeedbacks.value = feedbackRes.value.data || []
    }

    // API가 아직 없을 수 있으니 멘티 목록에서 count 가져오기 (fallback)
    if (summaryRes.status === 'rejected') {
      try {
        const { data: mentees } = await getMenteeList()
        summary.value.menteeCount = mentees?.length ?? 0
        summary.value.pendingFeedbackCount = pendingFeedbacks.value.length
      } catch {
        // 무시
      }
    }
  } catch (e) {
    console.error('대시보드 데이터 로드 실패:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard-page {
  padding: 32px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

/* ─── 2열 그리드 레이아웃 ─── */
.dashboard-grid {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 20px;
  align-items: start;
}

/* 좌측 열 */
.col-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 요약 카드 행 (담당 멘티 + 미작성 피드백 가로 나란히) */
.summary-row {
  display: flex;
  gap: 20px;
}

.summary-row .summary-card {
  flex: 1;
}

/* 우측 열 */
.col-right {
  min-width: 0;
}

/* ─── 요약 카드 ─── */
.summary-card {
  background: #fff;
  border-radius: 40px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  /* align-items: center; */
  gap: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.summary-icon {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
}

.summary-text {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 16px;
  font-weight: 500;
  color: #8E8E93;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.summary-value.highlight {
  color: #F54842;
}

/* ─── 섹션 카드 (공통) ─── */
.section-card {
  background: #fff;
  border-radius: 40px;
  padding: 30px 28px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 6px;
}

.section-subtitle {
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 20px;
}

/* ─── 멘토링 현황 (프로그레스) ─── */
.progress-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 0;
  border-bottom: 1px solid #E8E8E8;
}

.progress-item:last-child {
  border-bottom: none;
}

.progress-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.progress-avatar-placeholder {
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-name {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-right {
  display: flex;
  flex-direction: column;
  /* align-items: flex-end; */
  align-items: center;
  gap: 6px;
  width: 60px;
  flex-shrink: 0;
}

.progress-count {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  white-space: nowrap;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #E8E8E8;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #0CA5FE;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.empty-progress {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

/* ─── 피드백 리스트 ─── */
.feedback-section {
  min-height: 400px;
}

.feedback-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid #F0F0F0;
}

.feedback-item:last-child {
  border-bottom: none;
}

.feedback-avatar-wrap {
  flex-shrink: 0;
}

.feedback-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.feedback-avatar-placeholder {
  background: #E8F4FE;
  color: #0CA5FE;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feedback-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feedback-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feedback-name {
  font-size: 14px;
  font-weight: 600;
}

.feedback-date {
  font-size: 12px;
  color: #999;
}

.feedback-task-title {
  font-size: 16px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feedback-task-comment {
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
}

.feedback-btn {
  flex-shrink: 0;
  padding: 12px 24px;
  border-radius: 50px;
  border: none;
  background: #0CA5FE;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.feedback-btn:hover {
  background: #0994E4;
}

/* ─── 빈 상태 ─── */
.empty-feedback {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

/* ─── 스켈레톤 ─── */
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

/* ─── 반응형 ─── */
@media (max-width: 1100px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard-page {
    padding: 20px 16px;
  }

  .summary-row {
    flex-direction: column;
  }

  .summary-card {
    padding: 20px;
    flex-direction: row;
  }

  .summary-text {
    align-items: flex-start;
  }

  .summary-icon {
    width: 60px;
    height: 60px;
  }

  .summary-value {
    font-size: 22px;
  }

  .feedback-item {
    flex-wrap: wrap;
  }

  .feedback-btn {
    width: 100%;
    text-align: center;
  }
}
</style>
