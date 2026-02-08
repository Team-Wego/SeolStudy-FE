<template>
  <el-dialog
    v-model="visible"
    title="공유된 미디어 & 파일"
    :width="isMobile ? '100%' : '720px'"
    :fullscreen="isMobile"
    @open="loadMedia"
  >
    <!-- 탭 필터 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane name="all">
        <template #label>전체 <el-badge :value="counts.all" type="info" class="tab-badge" /></template>
      </el-tab-pane>
      <el-tab-pane name="IMAGE">
        <template #label>사진 <el-badge :value="counts.IMAGE" type="info" class="tab-badge" /></template>
      </el-tab-pane>
      <el-tab-pane name="VIDEO">
        <template #label>동영상 <el-badge :value="counts.VIDEO" type="info" class="tab-badge" /></template>
      </el-tab-pane>
      <el-tab-pane name="FILE">
        <template #label>파일 <el-badge :value="counts.FILE" type="info" class="tab-badge" /></template>
      </el-tab-pane>
    </el-tabs>

    <!-- 갤러리 그리드 -->
    <div v-if="isLoading" class="gallery-loading">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    </div>

    <div v-else-if="filteredItems.length === 0" class="gallery-empty">
      <el-empty description="공유된 미디어가 없습니다" :image-size="100" />
    </div>

    <div v-else class="gallery-grid">
      <div
        v-for="(item, index) in filteredItems"
        :key="item.messageId"
        class="gallery-item"
        :class="{ 'gallery-item-file': item.messageType === 'FILE' }"
        @click="handleItemClick(item, index)"
      >
        <!-- 이미지 -->
        <template v-if="item.messageType === 'IMAGE'">
          <img :src="item.fileUrl" class="grid-image" loading="lazy" />
        </template>

        <!-- 동영상 -->
        <template v-else-if="item.messageType === 'VIDEO'">
          <div class="video-thumb">
            <video :src="item.fileUrl" class="grid-video" muted />
            <div class="play-icon">▶</div>
          </div>
        </template>

        <!-- 파일 -->
        <template v-else>
          <div class="file-card">
            <span class="file-icon">{{ getFileIcon(item.fileName) }}</span>
            <span class="file-name">{{ item.fileName }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 이미지 프리뷰 오버레이 -->
    <Teleport to="body">
      <div v-if="showPreview" class="preview-overlay" @click.self="showPreview = false">
        <button class="preview-close" @click="showPreview = false">✕</button>
        <button v-if="imageUrls.length > 1" class="preview-arrow preview-prev" @click="prevImage">‹</button>
        <img :src="imageUrls[previewIndex]" class="preview-image" />
        <button v-if="imageUrls.length > 1" class="preview-arrow preview-next" @click="nextImage">›</button>
        <button class="preview-download" @click="downloadCurrentImage">
          <Download :size="18" />
          <span>저장</span>
        </button>
      </div>
    </Teleport>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Loading, Download } from '@element-plus/icons-vue'
import { getMediaFiles } from '@/api/chat/chatApi'

const props = defineProps({
  roomId: { type: String, default: '' },
})

const visible = defineModel({ type: Boolean, default: false })
const isMobile = ref(window.innerWidth <= 768)
const activeTab = ref('all')
const mediaData = ref([])
const isLoading = ref(false)
const showPreview = ref(false)
const previewIndex = ref(0)

const counts = computed(() => {
  const c = { all: mediaData.value.length, IMAGE: 0, VIDEO: 0, FILE: 0 }
  mediaData.value.forEach((item) => {
    if (c[item.messageType] !== undefined) c[item.messageType]++
  })
  return c
})

const filteredItems = computed(() => {
  if (activeTab.value === 'all') return mediaData.value
  return mediaData.value.filter((item) => item.messageType === activeTab.value)
})

const imageUrls = computed(() => {
  return filteredItems.value.filter((i) => i.messageType === 'IMAGE').map((i) => i.fileUrl)
})

async function loadMedia() {
  if (!props.roomId) return
  isLoading.value = true
  try {
    const { data } = await getMediaFiles(props.roomId)
    mediaData.value = data
  } catch (err) {
    console.error('미디어 로드 실패:', err)
  } finally {
    isLoading.value = false
  }
}

function handleTabChange() {
  // 탭 변경 시 추가 동작 불필요 (computed로 필터링)
}

function handleItemClick(item, index) {
  if (item.messageType === 'IMAGE') {
    // 현재 필터된 목록에서 이미지만의 인덱스를 계산
    const images = filteredItems.value.filter((i) => i.messageType === 'IMAGE')
    const imgIdx = images.findIndex((i) => i.messageId === item.messageId)
    previewIndex.value = imgIdx >= 0 ? imgIdx : 0
    showPreview.value = true
  } else if (item.messageType === 'VIDEO') {
    window.open(item.fileUrl, '_blank')
  } else if (item.messageType === 'FILE') {
    downloadFile(item.fileUrl, item.fileName)
  }
}

function prevImage() {
  previewIndex.value = (previewIndex.value - 1 + imageUrls.value.length) % imageUrls.value.length
}

function nextImage() {
  previewIndex.value = (previewIndex.value + 1) % imageUrls.value.length
}

function downloadCurrentImage() {
  const images = filteredItems.value.filter((i) => i.messageType === 'IMAGE')
  const item = images[previewIndex.value]
  if (!item) return
  const fileName = item.fileName || `image_${previewIndex.value + 1}.jpg`
  downloadFile(item.fileUrl, fileName)
}

function downloadFile(url, fileName) {
  // 캐시 우회를 위해 타임스탬프 쿼리 추가
  const cacheBustUrl = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now()
  fetch(cacheBustUrl, { mode: 'cors', cache: 'no-store' })
    .then((res) => res.blob())
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = fileName || 'download'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    })
    .catch(() => {
      // CORS 실패 시 XMLHttpRequest로 재시도
      const xhr = new XMLHttpRequest()
      xhr.open('GET', cacheBustUrl, true)
      xhr.responseType = 'blob'
      xhr.onload = () => {
        const blobUrl = URL.createObjectURL(xhr.response)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = fileName || 'download'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
      }
      xhr.onerror = () => {
        window.open(url, '_blank')
      }
      xhr.send()
    })
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function getFileIcon(fileName) {
  const ext = fileName?.split('.').pop().toLowerCase()
  const icons = {
    pdf: '📕', doc: '📘', docx: '📘', xls: '📗', xlsx: '📗',
    ppt: '📙', pptx: '📙', txt: '📝', zip: '🗜️', rar: '🗜️',
    hwp: '📄', csv: '📋',
  }
  return icons[ext] || '📄'
}
</script>

<style scoped>
.gallery-loading,
.gallery-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 8px 0;
  max-height: 70vh;
  overflow-y: auto;
  grid-auto-rows: min-content;
}

@media (min-width: 769px) {
  .gallery-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    max-height: 65vh;
  }
}

.gallery-item {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  background: #f5f5f5;
  border: 1px solid #eee;
}

.gallery-item:not(.gallery-item-file) {
  aspect-ratio: 1;
}

.gallery-item-file {
  min-height: 100px;
}

.grid-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  aspect-ratio: 1;
}

.video-thumb {
  position: relative;
  width: 100%;
  height: 100%;
}

.grid-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.file-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 12px 8px;
  text-align: center;
  background: #e8ecff;
  min-height: 100px;
}

.file-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.file-name {
  font-size: 11px;
  word-break: break-all;
  line-height: 1.3;
  max-height: 40px;
  overflow: hidden;
}

.tab-badge {
  margin-left: 4px;
}

/* 이미지 프리뷰 오버레이 */
.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 4px;
  user-select: none;
}

.preview-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 22px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.preview-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.preview-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 32px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.preview-arrow:hover {
  background: rgba(255, 255, 255, 0.3);
}

.preview-prev {
  left: 16px;
}

.preview-next {
  right: 16px;
}

.preview-download {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 14px;
  padding: 10px 24px;
  border-radius: 24px;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  z-index: 1;
  backdrop-filter: blur(8px);
  white-space: nowrap;
}

.preview-download:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
