<template>
  <div class="task-detail-page">
    <!-- Header -->
    <div class="detail-header">
      <button class="back-btn" @click="router.back()">
        <ChevronLeft :size="20" color="#1A1A1A" />
      </button>
      <h1 class="detail-title">{{ task?.title || '' }}</h1>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="skeleton skeleton-text" style="width: 120px; height: 14px; margin-bottom: 8px;" />
      <div class="skeleton skeleton-text" style="width: 50px; height: 22px; margin-bottom: 20px;" />
      <div class="skeleton" style="width: 100%; height: 60px; border-radius: 12px; margin-bottom: 16px;" />
      <div class="skeleton" style="width: 100%; height: 140px; border-radius: 16px;" />
    </div>

    <template v-else-if="task">
      <!-- Task Meta -->
      <div class="task-meta">
        <span v-if="task.goalName" class="meta-goal">목표 | {{ task.goalName }}</span>
        <SubjectTag v-if="subjectTagMap[task.subject]" :subject="subjectTagMap[task.subject]" size="sm" />
        <span v-else class="subject-tag tag-etc">{{ subjectNameMap[task.subject] || task.subject }}</span>
      </div>

      <!-- Worksheet Files -->
      <div v-if="task.worksheetFiles?.length" class="worksheet-section">
        <div v-for="file in task.worksheetFiles" :key="file.id" class="worksheet-item" @click="openFile(file.url)">
          <FileText :size="18" color="#8E8E93" />
          <span class="worksheet-name">{{ file.name }}</span>
          <Download :size="16" color="#C2C2C2" />
        </div>
      </div>

      <!-- Description Card -->
      <div v-if="task.description" class="description-card">
        <p class="description-text">{{ task.description }}</p>
      </div>

      <!-- Certification Section -->
      <template v-if="!task.images?.length">
        <!-- Empty State (인증 전) -->
        <div class="empty-cert">
          <AlertCircle :size="28" color="#C2C2C2" />
          <p class="empty-cert-text">학습지 사진을 업로드해</p>
          <p class="empty-cert-text">공부 인증을 완료해주세요!</p>
        </div>
      </template>
      <template v-else>
        <!-- Uploaded Images (인증 후) -->
        <div class="cert-images">
          <div class="cert-images-scroll">
            <img v-for="img in task.images" :key="img.id" :src="img.url" class="cert-image"
              @click="previewImage(img.url)" />
          </div>
        </div>

        <!-- Mentor Feedback -->
        <div v-if="feedback" class="feedback-section">
          <div class="mentor-row">
            <div class="mentor-avatar">
              <img v-if="feedback.mentorProfileUrl" :src="feedback.mentorProfileUrl" />
              <span v-else class="avatar-fallback">{{ feedback.mentorName?.charAt(0) }}</span>
            </div>
            <div class="mentor-info">
              <span class="mentor-name">{{ feedback.mentorName }} 멘토님</span>
              <span v-if="feedback.mentorDepartment" class="mentor-dept">{{ feedback.mentorDepartment }}</span>
            </div>
          </div>
          <span class="great-badge">GREAT</span>
          <p class="feedback-text">{{ feedback.content }}</p>
          <span class="feedback-time">{{ formatTimeAgo(feedback.createdAt) }}</span>
        </div>

        <!-- Comment Section -->
        <div class="comment-input-section">
          <h3 class="comment-label">COMMENT</h3>
          <template v-if="task.comment && !commentEditing">
            <!-- 기존 코멘트 표시 -->
            <div class="comment-display">
              <p class="comment-display-text">{{ task.comment }}</p>
              <button class="comment-edit-btn" @click="startCommentEdit">수정</button>
            </div>
          </template>
          <template v-else>
            <!-- 새 코멘트 입력 / 수정 -->
            <div class="comment-input-wrap">
              <textarea v-model="commentInput" class="comment-input"
                placeholder="오늘 공부하며 궁금했던 점이나 멘토님께 전하고 싶은 말을 남겨보세요." />
              <div class="comment-btn-row">
                <button v-if="commentEditing" class="comment-cancel-btn" @click="cancelCommentEdit">취소</button>
                <button class="comment-submit-btn" :disabled="!commentInput.trim()" @click="handleCommentSubmit">
                  {{ commentEditing ? '수정하기' : '코멘트 남기기' }}
                </button>
              </div>
            </div>
          </template>
        </div>
      </template>
    </template>

    <div v-else class="empty-state">과제를 찾을 수 없습니다.</div>

    <!-- Bottom Button -->
    <div class="bottom-bar">
      <button class="cert-btn" :class="{ done: task?.images?.length }" @click="handleCertification">
        <CheckCircle v-if="task?.images?.length" :size="18" color="#fff" />
        <span>{{ task?.images?.length ? '공부 인증 완료' : '공부 인증하기' }}</span>
      </button>
    </div>

    <!-- Hidden file input -->
    <input ref="fileInputRef" type="file" accept="image/*" multiple hidden @change="handleFileSelected" />

    <!-- Toast Modal -->
    <Transition name="toast">
      <div v-if="showToast" class="toast-overlay" @click="showToast = false">
        <div class="toast-card" @click.stop>
          <div class="toast-icon-wrap">
            <CheckCircle :size="40" color="#34C759" />
          </div>
          <p class="toast-title">공부 인증 완료!</p>
          <button class="toast-btn" @click="showToast = false">확인</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, FileText, Download, AlertCircle, CheckCircle } from 'lucide-vue-next'
import SubjectTag from '@/components/common/SubjectTag.vue'
import { getCookie } from '@/utils/cookie'
import { getTaskDetail, uploadTaskImages, updateTaskComment } from '@/api/task/taskApi'
import { getFeedbacks, getFeedbackDetail } from '@/api/feedback/feedbackApi'

const route = useRoute()
const router = useRouter()

const task = ref(null)
const feedback = ref(null)
const loading = ref(true)
const commentInput = ref('')
const commentEditing = ref(false)
const fileInputRef = ref(null)
const uploading = ref(false)
const showToast = ref(false)

const subjectTagMap = { ENG: 'english', MATH: 'math', KOR: 'korean' }
const subjectNameMap = { KOR: '국어', ENG: '영어', MATH: '수학', ETC: '기타' }

function formatTimeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

function openFile(url) {
  if (url) window.open(url, '_blank')
}

function previewImage(url) {
  if (url) window.open(url, '_blank')
}

function handleCertification() {
  if (task.value?.images?.length) {
    showToast.value = true
    return
  }
  fileInputRef.value?.click()
}

async function handleFileSelected(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return

  const memberId = getCookie('memberId')
  if (!memberId) return

  uploading.value = true
  try {
    const { data } = await uploadTaskImages(Number(memberId), task.value.id, files)
    // 업로드 후 이미지 반영
    if (!task.value.images) task.value.images = []
    task.value.images.push(...data)
  } catch (err) {
    console.error('이미지 업로드 실패:', err)
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

function startCommentEdit() {
  commentInput.value = task.value.comment || ''
  commentEditing.value = true
}

function cancelCommentEdit() {
  commentInput.value = ''
  commentEditing.value = false
}

async function handleCommentSubmit() {
  if (!commentInput.value.trim()) return
  const memberId = getCookie('memberId')
  if (!memberId) return

  try {
    await updateTaskComment(Number(memberId), task.value.id, commentInput.value.trim())
    task.value.comment = commentInput.value.trim()
    commentInput.value = ''
    commentEditing.value = false
  } catch (err) {
    console.error('코멘트 저장 실패:', err)
  }
}

async function loadTask() {
  const taskId = route.params.id
  if (!taskId) return

  loading.value = true
  try {
    const { data } = await getTaskDetail(taskId)
    task.value = data

    // 피드백 조회
    if (data.hasFeedback) {
      const memberId = getCookie('memberId')
      if (memberId) {
        try {
          const feedbackRes = await getFeedbacks(memberId, 'TASK')
          const list = feedbackRes.data || []
          // taskId 또는 taskTitle로 매칭
          const matched = list.find(f => f.taskId === data.id || f.taskTitle === data.title)
          if (matched?.feedbackId) {
            const detailRes = await getFeedbackDetail(matched.feedbackId)
            feedback.value = detailRes.data
          }
        } catch (e) {
          console.error('피드백 로드 실패:', e)
        }
      }
    }
  } catch (e) {
    console.error('과제 상세 로드 실패:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadTask())
</script>

<style scoped>
.task-detail-page {
  padding: 0 20px 120px;
  background: #fff;
  min-height: 100vh;
}

/* Header */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 12px 0;
  margin-bottom: 16px;
}

.back-btn {
  position: absolute;
  left: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: #1A1A1A;
  margin: 0;
}

/* Task Meta */
.task-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.meta-goal {
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
}

.subject-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 50px;
  width: fit-content;
}

.tag-etc {
  background: #F3F4F6;
  color: #6B7280;
}

/* Worksheet */
.worksheet-section {
  margin-bottom: 16px;
}

.worksheet-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid #EBEBEB;
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  margin-bottom: 8px;
}

.worksheet-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #3D3D3D;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Description Card */
.description-card {
  background: #F3F4F6;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.description-text {
  font-size: 14px;
  font-weight: 400;
  color: #3D3D3D;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}

/* Empty Certification */
.empty-cert {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  gap: 4px;
}

.empty-cert-text {
  font-size: 14px;
  color: #A6A6A6;
  margin: 0;
  line-height: 1.6;
}

/* Certification Images */
.cert-images {
  margin-bottom: 24px;
}

.cert-images-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.cert-images-scroll::-webkit-scrollbar {
  display: none;
}

.cert-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 12px;
  flex-shrink: 0;
  cursor: pointer;
}

/* Feedback Section */
.feedback-section {
  margin-bottom: 24px;
}

.mentor-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.mentor-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #E8E8E8;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mentor-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  font-size: 16px;
  font-weight: 700;
  color: #8E8E93;
}

.mentor-info {
  display: flex;
  flex-direction: column;
}

.mentor-name {
  font-size: 14px;
  font-weight: 700;
  color: #1A1A1A;
}

.mentor-dept {
  font-size: 12px;
  color: #A6A6A6;
}

.great-badge {
  display: inline-block;
  background: #34C759;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 50px;
  margin-bottom: 10px;
}

.feedback-text {
  font-size: 14px;
  color: #3D3D3D;
  line-height: 1.7;
  margin: 0 0 8px;
  white-space: pre-wrap;
}

.feedback-time {
  font-size: 12px;
  color: #C2C2C2;
  display: block;
  text-align: right;
}

/* Comment Thread */
.comment-thread {
  margin-bottom: 24px;
}

.comment-bubble {
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
}

.comment-bubble.student {
  background: #F3F4F6;
}

.bubble-text {
  font-size: 14px;
  color: #3D3D3D;
  line-height: 1.6;
  margin: 0 0 6px;
  white-space: pre-wrap;
}

.bubble-time {
  font-size: 12px;
  color: #C2C2C2;
  display: block;
  text-align: right;
}

/* Comment Input Section */
.comment-input-section {
  margin-bottom: 16px;
}

.comment-label {
  font-size: 13px;
  font-weight: 800;
  color: #1A1A1A;
  margin: 0 0 10px;
  letter-spacing: 0.5px;
}

.comment-input-wrap {
  position: relative;
}

.comment-input {
  width: 100%;
  min-height: 72px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid #EBEBEB;
  background: #fff;
  font-size: 13px;
  color: #3D3D3D;
  line-height: 1.5;
  outline: none;
  resize: none;
}

.comment-input::placeholder {
  color: #C2C2C2;
}

/* Comment Display (기존 코멘트) */
.comment-display {
  background: #F3F4F6;
  border-radius: 16px;
  padding: 16px;
  position: relative;
}

.comment-display-text {
  font-size: 14px;
  color: #3D3D3D;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  padding-right: 40px;
}

.comment-edit-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #0CA5FE;
  padding: 4px 8px;
}

.comment-btn-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.comment-cancel-btn {
  background: #F3F4F6;
  color: #8E8E93;
  border: none;
  border-radius: 50px;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.comment-submit-btn {
  background: #0CA5FE;
  color: #fff;
  border: none;
  border-radius: 50px;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.comment-submit-btn:disabled {
  background: #D1D1D6;
  cursor: not-allowed;
}

/* Bottom Bar */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  background: #fff;
  z-index: 20;
}

.cert-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  border: none;
  background: #0CA5FE;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.cert-btn.done {
  background: #0CA5FE;
}

/* Loading / Empty */
.loading-state {
  padding-top: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #A6A6A6;
  font-size: 14px;
}

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
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton-text {
  border-radius: 6px;
}

/* Toast Modal */
.toast-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.toast-card {
  background: #fff;
  border-radius: 24px;
  padding: 36px 28px 28px;
  text-align: center;
  width: 100%;
  max-width: 300px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.toast-icon-wrap {
  margin-bottom: 16px;
}

.toast-title {
  font-size: 18px;
  font-weight: 800;
  color: #1A1A1A;
  margin: 0 0 24px;
}

.toast-btn {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: #0CA5FE;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

/* Toast Transition */
.toast-enter-active {
  transition: opacity 0.2s ease;
}
.toast-enter-active .toast-card {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
}
.toast-leave-active {
  transition: opacity 0.15s ease;
}
.toast-leave-active .toast-card {
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.toast-enter-from {
  opacity: 0;
}
.toast-enter-from .toast-card {
  transform: scale(0.85);
  opacity: 0;
}
.toast-leave-to {
  opacity: 0;
}
.toast-leave-to .toast-card {
  transform: scale(0.9);
  opacity: 0;
}
</style>
