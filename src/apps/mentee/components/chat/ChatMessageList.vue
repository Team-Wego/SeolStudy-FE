<template>
  <el-scrollbar ref="scrollbarRef" class="message-area">
    <div ref="messageListRef" class="message-list">
      <!-- 로딩 -->
      <div v-if="isLoading" class="loading-wrap">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>메시지 불러오는 중...</span>
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="messages.length === 0" class="empty-wrap">
        <el-empty description="아직 대화 내용이 없습니다" :image-size="120">
          <template #description>
            <p class="text-gray-400">멘토에게 첫 메시지를 보내보세요!</p>
          </template>
        </el-empty>
      </div>

      <!-- 메시지 목록 -->
      <template v-else>
        <div
          v-for="msg in messages"
          :key="msg.messageId"
          class="message-row"
          :class="{ sent: msg.senderId === currentUserId, received: msg.senderId !== currentUserId }"
        >
          <!-- 상대 메시지: 이름 표시 -->
          <div v-if="msg.senderId !== currentUserId" class="sender-name">{{ senderName(msg.senderId) }}</div>

          <div class="bubble">
            <!-- 텍스트 내용 (파일과 함께 보낼 때) -->
            <div v-if="hasTextContent(msg)" class="text-content">{{ msg.content }}</div>

            <!-- IMAGE -->
            <div v-if="msg.messageType === 'IMAGE'" class="media-content">
              <el-image
                :src="msg.fileUrl"
                :preview-src-list="[msg.fileUrl]"
                fit="cover"
                class="chat-image"
                :alt="msg.fileName"
                lazy
              />
              <div class="file-name-label">{{ msg.fileName }}</div>
            </div>

            <!-- VIDEO -->
            <div v-if="msg.messageType === 'VIDEO'" class="media-content">
              <video :src="msg.fileUrl" controls class="chat-video" />
              <div class="file-name-label">{{ msg.fileName }}</div>
            </div>

            <!-- FILE -->
            <div v-if="msg.messageType === 'FILE'" class="file-content">
              <a :href="msg.fileUrl" :download="msg.fileName" class="file-link">
                <el-icon :size="28"><Document /></el-icon>
                <div class="file-info">
                  <div class="file-name">{{ msg.fileName }}</div>
                  <div class="file-action">클릭하여 다운로드</div>
                </div>
              </a>
            </div>

            <!-- TEXT 전용 -->
            <div v-if="msg.messageType === 'TEXT'" class="text-content">{{ msg.content }}</div>

            <!-- 시간 -->
            <div class="msg-time">{{ formatTime(msg.sentAt) }}</div>
          </div>
        </div>
      </template>
    </div>
  </el-scrollbar>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { Loading, Document } from '@element-plus/icons-vue'

const props = defineProps({
  messages: { type: Array, default: () => [] },
  currentUserId: { type: Number, required: true },
  mentorName: { type: String, default: '멘토' },
  isLoading: { type: Boolean, default: false },
})

const scrollbarRef = ref(null)
const messageListRef = ref(null)

function senderName(senderId) {
  return senderId === props.currentUserId ? '' : props.mentorName
}

function hasTextContent(msg) {
  return msg.messageType !== 'TEXT' && msg.content && msg.content.trim() !== ''
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function scrollToBottom() {
  nextTick(() => {
    if (scrollbarRef.value) {
      const wrapEl = scrollbarRef.value.wrapRef
      if (wrapEl) {
        wrapEl.scrollTop = wrapEl.scrollHeight
      }
    }
  })
}

// 메시지 변경 시 하단 스크롤
watch(
  () => props.messages.length,
  () => scrollToBottom(),
)

defineExpose({ scrollToBottom })
</script>

<style scoped>
.message-area {
  flex: 1;
  background: #f7f8fa;
}

.message-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100%;
}

.loading-wrap,
.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 8px;
  color: #999;
}

/* 메시지 행 */
.message-row {
  display: flex;
  flex-direction: column;
  max-width: 78%;
}

.message-row.sent {
  align-self: flex-end;
  align-items: flex-end;
}

.message-row.received {
  align-self: flex-start;
  align-items: flex-start;
}

.sender-name {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
  padding-left: 4px;
}

/* 말풍선 */
.bubble {
  padding: 10px 14px;
  border-radius: 16px;
  word-break: break-word;
  line-height: 1.5;
  font-size: 14px;
}

.sent .bubble {
  background: #4F6BFF;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.received .bubble {
  background: #fff;
  color: #1a1a1a;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* 이미지 */
.chat-image {
  max-width: 200px;
  border-radius: 8px;
  cursor: pointer;
}

/* 동영상 */
.chat-video {
  max-width: 240px;
  border-radius: 8px;
}

/* 파일명 라벨 */
.file-name-label {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}

/* 파일 다운로드 */
.file-content .file-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.file-info .file-name {
  font-weight: 600;
  font-size: 13px;
}

.file-info .file-action {
  font-size: 11px;
  opacity: 0.7;
}

/* 시간 */
.msg-time {
  font-size: 10px;
  opacity: 0.5;
  margin-top: 4px;
  text-align: right;
}
</style>
