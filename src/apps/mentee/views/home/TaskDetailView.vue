<template>
  <div class="task-detail-page">
    <div class="detail-header">
      <button class="back-btn" @click="router.back()">
        <ChevronLeft :size="20" color="#1A1A1A" />
      </button>
      <h1 class="detail-title">과제 상세</h1>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="skeleton skeleton-text" style="width: 120px; height: 14px; margin-bottom: 8px;" />
      <div class="skeleton skeleton-text" style="width: 50px; height: 22px; margin-bottom: 20px;" />
      <div class="skeleton" style="width: 100%; height: 60px; border-radius: 12px; margin-bottom: 16px;" />
      <div class="skeleton" style="width: 100%; height: 140px; border-radius: 16px;" />
    </div>

    <template v-else-if="task">
      <section class="detail-card info-section">
        <div class="info-top">
          <SubjectTag v-if="subjectTagMap[task.subject]" :subject="subjectTagMap[task.subject]" size="sm" />
          <span v-else class="subject-tag tag-etc">{{ subjectNameMap[task.subject] || task.subject }}</span>
          <span v-if="goalName" class="meta-goal">목표 | {{ goalName }}</span>
        </div>

        <h2 class="task-title">{{ task.title }}</h2>

        <div v-if="task.description" class="description-box">
          <p class="description-text">{{ task.description }}</p>
        </div>

        <div v-if="task.worksheetFiles?.length" class="worksheet-list">
          <div v-for="file in task.worksheetFiles" :key="file.id" class="worksheet-item" @click="openFile(file.url)">
            <div class="file-info">
              <FileText :size="18" color="#8E8E93" />
              <span class="worksheet-name">{{ file.name }}</span>
            </div>
            <Download :size="16" color="#C2C2C2" />
          </div>
        </div>
      </section>

      <section class="detail-card activity-section">
        <h3 class="section-label">나의 공부 인증</h3>

        <div v-if="!task.images?.length" class="empty-cert" @click="handleCertification">
          <Camera :size="28" color="#C2C2C2" />
          <p class="empty-cert-text">학습지 사진을 업로드해 주세요</p>
        </div>
        <div v-else class="cert-images-container">
          <div class="cert-images-scroll">
            <img v-for="img in task.images" :key="img.id" :src="img.url" class="cert-image"
              @click="previewImage(img.url)" />
            <button class="add-more-img-btn" @click="handleCertification">
              <Plus :size="24" color="#A6A6A6" />
            </button>
          </div>
        </div>

        <div class="comment-area">
          <div class="comment-header">
            <span class="comment-title">STUDENT COMMENT</span>
            <div v-if="task.comment && !commentEditing" class="kebab-container">
              <button class="kebab-trigger" @click.stop="toggleKebab">
                <MoreVertical :size="18" color="#A6A6A6" />
              </button>
              <div v-if="showKebab" class="kebab-menu" v-click-outside="closeKebab">
                <button @click="startCommentEdit">수정하기</button>
                <button class="delete-btn" @click="handleDeleteComment">삭제하기</button>
              </div>
            </div>
          </div>

          <template v-if="!task.comment || commentEditing">
            <div class="comment-input-wrap">
              <textarea v-model="commentInput" class="comment-textarea" placeholder="오늘 공부하며 궁금했던 점을 남겨보세요." />
              <div class="comment-action-btns">
                <button v-if="commentEditing" class="btn-cancel" @click="cancelCommentEdit">취소</button>
                <button class="btn-submit" :disabled="!commentInput.trim()" @click="handleCommentSubmit">
                  {{ commentEditing ? '수정완료' : '등록하기' }}
                </button>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="comment-view">
              <p class="comment-text">{{ task.comment }}</p>
              <span class="comment-date">{{ formatTimeAgo(task.commentCreatedAt) }}</span>
            </div>
          </template>
        </div>
      </section>

      <section v-if="feedback" class="detail-card feedback-section">
        <h3 class="section-label">멘토 피드백</h3>
        <div class="mentor-card">
          <div class="mentor-profile">
            <div class="mentor-avatar">
              <img v-if="feedback.mentorProfileUrl" :src="feedback.mentorProfileUrl" />
              <span v-else>{{ feedback.mentorName?.charAt(0) }}</span>
            </div>
            <div class="mentor-name-info">
              <span class="m-name">{{ feedback.mentorName }} 멘토님</span>
              <span class="m-dept">{{ feedback.mentorDepartment }}</span>
            </div>
            <div class="great-badge">GREAT</div>
          </div>
          <div class="feedback-body">
            <p class="feedback-text">{{ feedback.content }}</p>
            <span class="feedback-time">{{ formatTimeAgo(feedback.createdAt) }}</span>
          </div>

          <div v-if="feedback.commentReply" class="mentor-reply">
            <div class="reply-icon">💬</div>
            <p class="reply-text">{{ feedback.commentReply }}</p>
          </div>
        </div>
      </section>
    </template>

    <div v-else class="empty-state">과제를 찾을 수 없습니다.</div>

    <div class="bottom-bar">
      <button class="cert-main-btn" :class="{ done: task?.submittedAt }" @click="handleCertification">
        <CheckCircle v-if="task?.submittedAt" :size="18" color="#fff" />
        <span>{{ task?.submittedAt ? '공부 인증 완료' : '공부 인증하기' }}</span>
      </button>
    </div>

    <input ref="fileInputRef" type="file" accept="image/*" multiple hidden @change="handleFileSelected" />

    <Transition name="toast">
      <div v-if="showToast" class="toast-overlay" @click="showToast = false">
        <div class="toast-card-modal" @click.stop>
          <CheckCircle :size="40" color="#34C759" style="margin-bottom:16px" />
          <p class="toast-title">공부 인증 완료!</p>
          <button class="toast-btn" @click="showToast = false">확인</button>
        </div>
      </div>
    </Transition>

    <Teleport to="body">
      <div v-if="previewModal.show" class="image-preview-overlay" @click.self="closePreview">
        <button v-if="previewModal.images.length > 1" class="preview-nav preview-prev" @click="prevImage">
          <ChevronLeft :size="28" />
        </button>
        <img :src="previewModal.images[previewModal.index]" class="preview-image" />
        <button v-if="previewModal.images.length > 1" class="preview-nav preview-next" @click="nextImage">
          <ChevronRight :size="28" />
        </button>
        <button class="preview-close" @click="closePreview">
          <X :size="24" />
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronLeft, ChevronRight, X, FileText, Download,
  Camera, Plus, MoreVertical, CheckCircle
} from 'lucide-vue-next'
import SubjectTag from '@/components/common/SubjectTag.vue'
import { getCookie } from '@/utils/cookie'
import { getTaskDetail, uploadTaskImages, updateTaskComment, submitTask, updateTaskStatus } from '@/api/task/taskApi'
import { getTaskFeedback } from '@/api/feedback/feedbackApi'
import { getGoals } from '@/api/mentoring/goalApi'

const route = useRoute()
const router = useRouter()

const task = ref(null)
const feedback = ref(null)
const goalName = ref('')
const loading = ref(true)
const commentInput = ref('')
const commentEditing = ref(false)
const showKebab = ref(false)
const fileInputRef = ref(null)
const showToast = ref(false)
const previewModal = ref({ show: false, images: [], index: 0 })

const subjectTagMap = { ENG: 'english', MATH: 'math', KOR: 'korean' }
const subjectNameMap = { KOR: '국어', ENG: '영어', MATH: '수학', ETC: '기타' }

// --- Logic Functions ---

const toggleKebab = () => { showKebab.value = !showKebab.value }
const closeKebab = () => { showKebab.value = false }

function formatTimeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

function openFile(url) { if (url) window.open(url, '_blank') }

function previewImage(url) {
  const images = task.value.images.map(img => img.url)
  previewModal.value = { show: true, images, index: images.indexOf(url) }
}
function closePreview() { previewModal.value.show = false }
function prevImage() { previewModal.value.index = (previewModal.value.index - 1 + previewModal.value.images.length) % previewModal.value.images.length }
function nextImage() { previewModal.value.index = (previewModal.value.index + 1) % previewModal.value.images.length }

function handleCertification() {
  if (task.value?.submittedAt) { showToast.value = true; return; }
  fileInputRef.value?.click()
}

async function handleFileSelected(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  const memberId = getCookie('memberId')
  try {
    const { data } = await uploadTaskImages(Number(memberId), task.value.id, files)
    if (!task.value.images) task.value.images = []
    task.value.images.push(...data)
    await submitTask(Number(memberId), task.value.id)
    task.value.submittedAt = new Date().toISOString()
    await updateTaskStatus(Number(memberId), task.value.id, true)
    task.value.isChecked = true
    showToast.value = true
  } catch (err) { console.error(err) }
  e.target.value = ''
}

function startCommentEdit() {
  commentInput.value = task.value.comment || ''
  commentEditing.value = true
  showKebab.value = false
}
function cancelCommentEdit() { commentEditing.value = false }

async function handleCommentSubmit() {
  const memberId = getCookie('memberId')
  try {
    await updateTaskComment(Number(memberId), task.value.id, commentInput.value.trim())
    task.value.comment = commentInput.value.trim()
    task.value.commentCreatedAt = new Date().toISOString()
    commentEditing.value = false
  } catch (err) { console.error(err) }
}

async function handleDeleteComment() {
  if (!confirm('코멘트를 삭제하시겠습니까?')) return
  const memberId = getCookie('memberId')
  try {
    await updateTaskComment(Number(memberId), task.value.id, '') // 빈 값으로 업데이트
    task.value.comment = ''
    showKebab.value = false
  } catch (err) { console.error(err) }
}

const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}

async function loadTask() {
  const taskId = route.params.id
  loading.value = true
  try {
    const { data } = await getTaskDetail(taskId)
    task.value = data
    const memberId = getCookie('memberId')

    // 목표 + 피드백 병렬 로드
    const promises = []

    if (data.goalId) {
      promises.push(
        getGoals(memberId).then(goalsRes => {
          const goals = goalsRes.data?.content || goalsRes.data || []
          const matched = goals.find(g => (g.goalId || g.id) === data.goalId)
          if (matched) goalName.value = matched.name || matched.goalName
        }).catch(() => {})
      )
    }

    promises.push(
      getTaskFeedback(data.id).then(res => {
        if (res.data) feedback.value = res.data
      }).catch(() => {})
    )

    await Promise.all(promises)
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(() => loadTask())
</script>

<style scoped>
.task-detail-page {
  padding: 0 20px 120px;
  background: #F8F9FA;
  min-height: 100vh;
}

/* Header */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  margin: 0 -20px 20px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 50;
}

.back-btn {
  position: absolute;
  left: 16px;
  background: none;
  border: none;
  cursor: pointer;
}

.detail-title {
  font-size: 17px;
  font-weight: 700;
  color: #1A1A1A;
}

/* 공통 카드 스타일 */
.detail-card {
  background: #fff;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.section-label {
  font-size: 13px;
  font-weight: 800;
  color: #1A1A1A;
  margin-bottom: 16px;
  text-transform: uppercase;
}

/* [1] Info Section */
.info-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.meta-goal {
  font-size: 13px;
  font-weight: 600;
  color: #0CA5FE;
}

.task-title {
  font-size: 20px;
  font-weight: 800;
  color: #1A1A1A;
  margin-bottom: 16px;
}

.description-box {
  background: #F8F9FA;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.description-text {
  font-size: 14px;
  line-height: 1.6;
  color: #4A4A4A;
  white-space: pre-wrap;
}

.worksheet-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  border: 1px solid #F1F1F1;
  border-radius: 12px;
  margin-bottom: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.worksheet-name {
  font-size: 14px;
  color: #3D3D3D;
  font-weight: 500;
}

/* [2] Activity Section */
.empty-cert {
  border: 2px dashed #EBEBEB;
  border-radius: 16px;
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.empty-cert-text {
  font-size: 13px;
  color: #A6A6A6;
}

.cert-images-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.cert-image {
  width: 90px;
  height: 90px;
  border-radius: 10px;
  object-fit: cover;
}

.add-more-img-btn {
  width: 90px;
  height: 90px;
  border-radius: 10px;
  background: #F5F5F5;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Comment Area */
.comment-area {
  margin-top: 24px;
  border-top: 1px solid #F1F1F1;
  padding-top: 20px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.comment-title {
  font-size: 12px;
  font-weight: 700;
  color: #8E8E93;
  letter-spacing: 0.5px;
}

.kebab-container {
  position: relative;
}

.kebab-trigger {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
}

.kebab-menu {
  position: absolute;
  right: 0;
  top: 28px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 100;
  min-width: 100px;
  overflow: hidden;
}

.kebab-menu button {
  width: 100%;
  padding: 12px 16px;
  font-size: 13px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

.kebab-menu button:active {
  background: #F5F5F5;
}

.delete-btn {
  color: #FF3B30 !important;
}

.comment-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #EBEBEB;
  background: #F9F9F9;
  font-size: 14px;
  outline: none;
  resize: none;
}

.comment-action-btns {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.btn-submit {
  background: #0CA5FE;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
}

.btn-cancel {
  background: #EBEBEB;
  color: #8E8E93;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
}

.comment-view {
  background: #F9F9F9;
  padding: 14px;
  border-radius: 12px;
}

.comment-text {
  font-size: 14px;
  color: #3D3D3D;
  line-height: 1.5;
  margin-bottom: 6px;
}

.comment-date {
  font-size: 11px;
  color: #C2C2C2;
}

/* [3] Feedback Section */
.mentor-card {
  background: #F0F9FF;
  border-radius: 16px;
  padding: 16px;
}

.mentor-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  position: relative;
}

.mentor-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fff;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #0CA5FE;
}

.mentor-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.m-name {
  font-size: 14px;
  font-weight: 700;
  display: block;
}

.m-dept {
  font-size: 11px;
  color: #8E8E93;
}

.great-badge {
  position: absolute;
  right: 0;
  top: 0;
  background: #34C759;
  color: #fff;
  font-size: 10px;
  font-weight: 900;
  padding: 4px 10px;
  border-radius: 20px;
}

.feedback-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 8px;
}

.feedback-time {
  font-size: 11px;
  color: #A6A6A6;
  display: block;
  text-align: right;
}

.mentor-reply {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(12, 165, 254, 0.1);
  display: flex;
  gap: 8px;
}

.reply-text {
  font-size: 13px;
  color: #0CA5FE;
  font-weight: 500;
}

/* Bottom Bar */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px 32px;
  background: #fff;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
}

.cert-main-btn {
  width: 100%;
  height: 54px;
  border-radius: 16px;
  border: none;
  background: #0CA5FE;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cert-main-btn.done {
  background: #B0B0B0;
}

/* Toast & Image Preview Styles (기존과 동일하되 최적화) */
.toast-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-card-modal {
  background: #fff;
  border-radius: 24px;
  padding: 32px;
  text-align: center;
  width: 80%;
  max-width: 300px;
}

.toast-title {
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 24px;
}

.toast-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: #0CA5FE;
  color: #fff;
  font-weight: 700;
}

.image-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 95%;
  max-height: 80%;
  object-fit: contain;
}

.preview-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #fff;
  padding: 20px;
}

.preview-prev {
  left: 0;
}

.preview-next {
  right: 0;
}

.preview-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: #fff;
}
</style>