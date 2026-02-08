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
        v-for="item in filteredItems"
        :key="item.messageId"
        class="gallery-item"
        @click="handleItemClick(item)"
      >
        <!-- 이미지 -->
        <template v-if="item.messageType === 'IMAGE'">
          <el-image :src="item.fileUrl" fit="cover" class="grid-image" lazy :preview-src-list="imageUrls" />
          <div class="item-date">{{ formatDate(item.sentAt) }}</div>
        </template>

        <!-- 동영상 -->
        <template v-else-if="item.messageType === 'VIDEO'">
          <div class="video-thumb">
            <video :src="item.fileUrl" class="grid-video" muted />
            <div class="play-icon">▶</div>
          </div>
          <div class="item-date">{{ formatDate(item.sentAt) }}</div>
        </template>

        <!-- 파일 -->
        <template v-else>
          <div class="file-card">
            <span class="file-icon">{{ getFileIcon(item.fileName) }}</span>
            <span class="file-name">{{ item.fileName }}</span>
          </div>
          <div class="item-date">{{ formatDate(item.sentAt) }}</div>
        </template>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { getMediaFiles } from '@/api/chat/chatApi'

const props = defineProps({
  roomId: { type: String, default: '' },
})

const visible = defineModel({ type: Boolean, default: false })
const isMobile = ref(window.innerWidth <= 768)
const activeTab = ref('all')
const mediaData = ref([])
const isLoading = ref(false)

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
  return mediaData.value.filter((i) => i.messageType === 'IMAGE').map((i) => i.fileUrl)
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

function handleItemClick(item) {
  if (item.messageType === 'VIDEO') {
    window.open(item.fileUrl, '_blank')
  } else if (item.messageType === 'FILE') {
    const a = document.createElement('a')
    a.href = item.fileUrl
    a.download = item.fileName
    a.click()
  }
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
  gap: 8px;
  padding: 8px 0;
  max-height: 70vh;
  overflow-y: auto;
}

@media (min-width: 769px) {
  .gallery-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    max-height: 65vh;
  }
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #f5f5f5;
}

.grid-image {
  width: 100%;
  height: 100%;
}

.grid-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  padding: 12px;
  text-align: center;
  background: #e8ecff;
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

.item-date {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 10px;
  padding: 3px 6px;
  text-align: center;
}

.tab-badge {
  margin-left: 4px;
}
</style>
