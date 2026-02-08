<template>
  <div class="mentor-chat">
    <!-- 좌측: 채팅방 목록 -->
    <aside class="room-list-panel">
      <div class="panel-header">
        <h2 class="panel-title">채팅</h2>
      </div>

      <!-- 로딩 -->
      <div v-if="roomsLoading" class="room-loading">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="rooms.length === 0" class="room-empty">
        <el-empty description="채팅방이 없습니다" :image-size="80" />
      </div>

      <!-- 방 목록 -->
      <div v-else class="room-items">
        <div
          v-for="room in rooms"
          :key="room.roomId"
          class="room-item"
          :class="{ active: selectedRoomId === room.roomId }"
          @click="selectRoom(room)"
        >
          <div class="room-avatar">
            <img v-if="room.menteeProfileUrl" :src="room.menteeProfileUrl" alt="" class="avatar-img" />
            <span v-else>{{ (room.menteeName || '멘티').charAt(0) }}</span>
          </div>
          <div class="room-info">
            <div class="room-top">
              <span class="room-name">{{ room.menteeName || '멘티' }}</span>
              <span class="room-time">{{ formatDate(room.lastMessageAt) }}</span>
            </div>
            <div class="room-bottom">
              <span class="room-last-msg">{{ room.lastMessage || '대화를 시작하세요' }}</span>
              <span v-if="room.mentorUnreadCount > 0" class="unread-badge">
                {{ room.mentorUnreadCount > 99 ? '99+' : room.mentorUnreadCount }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 우측: 채팅 영역 -->
    <section class="chat-panel">
      <!-- 채팅방 미선택 -->
      <div v-if="!selectedRoomId" class="chat-empty">
        <MessageSquare :size="48" class="text-gray-300" />
        <p class="text-gray-400 mt-3">채팅방을 선택하세요</p>
      </div>

      <!-- 채팅 영역 -->
      <template v-else>
        <!-- 헤더 -->
        <div class="chat-header">
          <div class="header-left">
            <span class="chat-name">{{ selectedMenteeName }}</span>
            <span v-if="chatStore.isConnected" class="status-dot online" />
            <span v-else class="status-dot offline" />
          </div>
          <el-button :icon="FolderOpened" circle size="small" @click="showGallery = true" />
        </div>

        <!-- 메시지 목록 -->
        <ChatMessageList
          ref="messageListRef"
          :messages="chatStore.messages"
          :current-user-id="chatStore.currentUser.id"
          :mentor-name="selectedMenteeName"
          :is-loading="chatStore.isLoading"
        />

        <!-- 입력바 -->
        <ChatInputBar @send="handleSend" />

        <!-- 미디어 갤러리 -->
        <ChatMediaGallery
          v-model="showGallery"
          :room-id="selectedRoomId"
        />
      </template>
    </section>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { FolderOpened } from '@element-plus/icons-vue'
import { MessageSquare } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { useChatStore } from '@/stores/chatStore'
import { useChat } from '@/composables/useChat'
import { getMentorRooms, getMessages, markAsRead } from '@/api/chat/chatApi'
import ChatMessageList from '@/apps/mentee/components/chat/ChatMessageList.vue'
import ChatInputBar from '@/apps/mentee/components/chat/ChatInputBar.vue'
import ChatMediaGallery from '@/apps/mentee/components/chat/ChatMediaGallery.vue'

const chatStore = useChatStore()
const { connect, disconnect, subscribeRoom, enterRoom, sendMessage } = useChat()

const rooms = ref([])
const roomsLoading = ref(true)
const selectedRoomId = ref(null)
const selectedMenteeName = ref('')
const messageListRef = ref(null)
const showGallery = ref(false)
let wsConnected = false
let roomPollTimer = null
const ROOM_POLL_INTERVAL = 5000

// 채팅방 목록 로드
async function loadRooms() {
  const userId = chatStore.currentUser.id
  if (!userId) return

  try {
    const { data } = await getMentorRooms(userId)
    // 현재 선택된 방의 unreadCount는 0으로 유지
    const newRooms = (data || []).map((r) => {
      if (r.roomId === selectedRoomId.value) {
        r.mentorUnreadCount = 0
      }
      return r
    })
    rooms.value = newRooms
  } catch (err) {
    console.error('[MentorChat] 채팅방 목록 로드 실패:', err)
  } finally {
    roomsLoading.value = false
  }
}

// 채팅방 선택
async function selectRoom(room) {
  if (selectedRoomId.value === room.roomId) return

  selectedRoomId.value = room.roomId
  selectedMenteeName.value = room.menteeName || '멘티'
  chatStore.currentRoom = room
  chatStore.isLoading = true
  chatStore.setMessages([])

  try {
    // WebSocket 연결 (최초 1회)
    if (!wsConnected) {
      await connect()
      wsConnected = true
    }

    // 채팅방 구독 (방 전환 시 기존 구독 자동 해제됨)
    subscribeRoom(room.roomId, (msg) => {
      chatStore.addMessage(msg)
    })

    // 입장 알림 (읽음 처리)
    enterRoom(room.roomId, chatStore.currentUser.id)

    // 메시지 이력 로드
    const { data: msgs } = await getMessages(room.roomId, 0, 50)
    chatStore.setMessages([...msgs].reverse())

    // 로딩 해제 후 스크롤 (메시지가 렌더링된 뒤에 스크롤해야 함)
    chatStore.isLoading = false
    nextTick(() => {
      messageListRef.value?.scrollToBottom()
    })

    // 읽음 처리 후 목록 갱신
    await markAsRead(room.roomId, chatStore.currentUser.id)
    room.mentorUnreadCount = 0
  } catch (err) {
    console.error('[MentorChat] 채팅방 로드 실패:', err)
    ElMessage.error('채팅방 연결에 실패했습니다.')
  } finally {
    chatStore.isLoading = false
  }
}

// 메시지 전송
function handleSend({ messageType, content, fileUrl, fileName }) {
  if (!selectedRoomId.value) return

  sendMessage({
    roomId: selectedRoomId.value,
    senderId: chatStore.currentUser.id,
    messageType,
    content,
    fileUrl,
    fileName,
  })
}

// 날짜 포맷
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()

  if (isToday) {
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

onMounted(() => {
  loadRooms()
  roomPollTimer = setInterval(loadRooms, ROOM_POLL_INTERVAL)
})

onUnmounted(() => {
  if (roomPollTimer) clearInterval(roomPollTimer)
  disconnect()
  chatStore.reset()
})
</script>

<style scoped>
.mentor-chat {
  display: flex;
  height: 100%;
  background: #f7f8fa;
}

/* 좌측 패널 */
.room-list-panel {
  width: 320px;
  min-width: 320px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}

.room-loading,
.room-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.room-items {
  flex: 1;
  overflow-y: auto;
}

.room-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f8f8f8;
}

.room-item:hover {
  background: #f5f7ff;
}

.room-item.active {
  background: #eef1ff;
}

.room-avatar {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 50%;
  background: #4F6BFF;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  font-weight: 700;
}

.room-info {
  flex: 1;
  min-width: 0;
}

.room-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.room-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.room-time {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
}

.room-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-last-msg {
  font-size: 13px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}

.unread-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #FF3B30;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  border-radius: 9px;
}

/* 우측 패널 */
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 헤더 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-name {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: #52c41a;
}

.status-dot.offline {
  background: #d9d9d9;
}
</style>
