<template>
  <div class="feedback-detail-page">
    <!-- 헤더 -->
    <div class="detail-header">
      <button class="back-btn" @click="goBack">
        <ChevronLeft :size="20" />
      </button>
      <h1 class="detail-title">피드백 상세</h1>
    </div>

    <div v-if="loading" class="loading-text">불러오는 중...</div>

    <template v-else-if="feedback">
      <!-- 피드백 타입 태그 -->
      <div class="type-row">
        <span class="type-tag" :class="'type-' + feedback.feedbackType">
          {{ typeLabel(feedback.feedbackType) }}
        </span>
        <span class="detail-date">{{ formatDate(feedback.createdAt) }}</span>
      </div>

      <!-- 멘토 정보 -->
      <div class="mentor-info">
        <span class="mentor-label">작성자</span>
        <span class="mentor-name">{{ feedback.mentorName }}</span>
      </div>

      <!-- 대상 날짜 -->
      <div v-if="feedback.targetDate" class="target-date-row">
        <span class="target-label">대상 날짜</span>
        <span class="target-value">{{ feedback.targetDate }}</span>
      </div>

      <!-- 피드백 내용 -->
      <div class="content-card">
        <p class="content-text" v-html="renderHighlightedText(feedback.content, feedback.highlight)"></p>
      </div>

      <!-- 첨부 이미지 -->
      <div v-if="feedback.feedbackImages && feedback.feedbackImages.length > 0" class="images-section">
        <h3 class="images-title">첨부 이미지</h3>
        <div class="images-grid">
          <img v-for="(img, idx) in feedback.feedbackImages" :key="img.feedbackImageId" :src="img.imageUrl"
            class="feedback-image" @click="openPreview(idx)" />
        </div>
      </div>
    </template>

    <div v-else class="empty-text">피드백을 찾을 수 없습니다</div>

    <!-- 이미지 미리보기 모달 -->
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
        <span v-if="previewModal.images.length > 1" class="preview-counter">
          {{ previewModal.index + 1 }} / {{ previewModal.images.length }}
        </span>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next'
import { getFeedbackDetail } from '@/api/feedback/feedbackApi'

const route = useRoute()
const router = useRouter()
const feedback = ref(null)
const loading = ref(false)

function typeLabel(type) {
  const map = { TASK: '일간', WEEKLY: '주간', MONTHLY: '월간', PLANNER: '플래너' }
  return map[type] || type
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`
}

function goBack() {
  router.back()
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

const previewModal = ref({ show: false, images: [], index: 0 })

function openPreview(idx) {
  const images = (feedback.value?.feedbackImages || []).map(img => img.imageUrl)
  previewModal.value = { show: true, images, index: idx }
}
function closePreview() { previewModal.value.show = false }
function prevImage() {
  const m = previewModal.value
  m.index = (m.index - 1 + m.images.length) % m.images.length
}
function nextImage() {
  const m = previewModal.value
  m.index = (m.index + 1) % m.images.length
}

async function loadDetail() {
  const feedbackId = route.params.id
  if (!feedbackId) return
  loading.value = true
  try {
    const { data } = await getFeedbackDetail(feedbackId)
    feedback.value = data
  } catch (e) {
    console.error('[FeedbackDetail] 로드 실패:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadDetail())
</script>

<style scoped>
.feedback-detail-page {
  padding: 0 20px 24px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #333;
  display: flex;
}

.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.type-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.type-tag {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.type-TASK {
  background: #2196f3;
}

.type-WEEKLY {
  background: #ff9800;
}

.type-MONTHLY {
  background: #9c27b0;
}

.type-PLANNER {
  background: #4caf50;
}

.detail-date {
  font-size: 13px;
  color: #999;
}

.mentor-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.mentor-label {
  font-size: 13px;
  color: #999;
}

.mentor-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.target-date-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.target-label {
  font-size: 13px;
  color: #999;
}

.target-value {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.content-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.content-text {
  font-size: 14px;
  color: #333;
  line-height: 1.8;
  margin: 0;
  white-space: pre-wrap;
}

.images-section {
  margin-top: 8px;
}

.images-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.feedback-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}

:deep(.highlight-mark) {
  background-color: #fff59d;
  border-radius: 2px;
  padding: 0px 1px;
  box-decoration-break: clone;
}

.loading-text,
.empty-text {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 40px 0;
}
</style>

<style>
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

.preview-image {
  max-width: 85vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
}

.preview-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.preview-nav:hover {
  background: rgba(255, 255, 255, 0.3);
}

.preview-prev {
  left: 16px;
}

.preview-next {
  right: 16px;
}

.preview-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.preview-counter {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.5);
  padding: 4px 14px;
  border-radius: 16px;
}
</style>
