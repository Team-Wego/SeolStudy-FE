<template>
  <div class="chat-container">
    <!-- 채팅방이 없을 때 -->
    <div v-if="!chatStore.isLoading && !chatStore.currentRoom" class="no-room">
      <el-empty description="배정된 멘토가 없습니다">
        <template #description>
          <p class="text-gray-400 text-sm">멘토가 배정되면 채팅이 시작됩니다.</p>
        </template>
      </el-empty>
    </div>

    <!-- 채팅 화면 -->
    <template v-else-if="chatStore.currentRoom">
      <ChatHeader
        :mentor-name="mentorName"
        :is-connected="chatStore.isConnected"
        @open-gallery="showGallery = true"
      />

      <ChatMessageList
        ref="messageListRef"
        :messages="chatStore.messages"
        :current-user-id="chatStore.currentUser.id"
        :mentor-name="mentorName"
        :is-loading="chatStore.isLoading"
      />

      <ChatInputBar @send="handleSend" />

      <ChatMediaGallery
        v-model="showGallery"
        :room-id="chatStore.currentRoom?.roomId"
      />
    </template>

    <!-- 로딩 -->
    <div v-else class="loading-screen">
      <el-icon class="is-loading" :size="36"><Loading /></el-icon>
      <p class="text-gray-400 mt-2">채팅방 연결 중...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useChatStore } from '@/stores/chatStore'
import { useChat } from '@/composables/useChat'
import { getMenteeRooms, getMessages } from '@/api/chat/chatApi'
import ChatHeader from '@/apps/mentee/components/chat/ChatHeader.vue'
import ChatMessageList from '@/apps/mentee/components/chat/ChatMessageList.vue'
import ChatInputBar from '@/apps/mentee/components/chat/ChatInputBar.vue'
import ChatMediaGallery from '@/apps/mentee/components/chat/ChatMediaGallery.vue'

const chatStore = useChatStore()
const { connect, disconnect, subscribeRoom, enterRoom, sendMessage } = useChat()

const messageListRef = ref(null)
const showGallery = ref(false)
const mentorName = ref('멘토')

// 초기화: 채팅방 로드 → WebSocket 연결 → 메시지 이력 로드
onMounted(async () => {
  chatStore.isLoading = true

  try {
    // 1. 멘티의 채팅방 목록 가져오기 (첫 번째 방 사용)
    const userId = chatStore.currentUser.id
    if (!userId) {
      chatStore.isLoading = false
      return
    }

    const { data: rooms } = await getMenteeRooms(userId)

    if (!rooms || rooms.length === 0) {
      chatStore.isLoading = false
      return
    }

    const room = rooms[0]
    chatStore.currentRoom = room
    mentorName.value = `멘토 (ID: ${room.mentorId})`

    // 2. WebSocket 연결
    await connect()

    // 3. 채팅방 구독 (실시간 메시지 수신)
    subscribeRoom(room.roomId, (msg) => {
      chatStore.addMessage(msg)
    })

    // 4. 입장 알림 (읽음 처리)
    enterRoom(room.roomId, userId)

    // 5. 메시지 이력 로드
    const { data: msgs } = await getMessages(room.roomId, 0, 50)
    chatStore.setMessages([...msgs].reverse())
  } catch (err) {
    console.error('[Chat] 초기화 실패:', err)
    ElMessage.error('채팅방 연결에 실패했습니다.')
  } finally {
    chatStore.isLoading = false
  }
})

onUnmounted(() => {
  disconnect()
})

// 메시지 전송
function handleSend({ messageType, content, fileUrl, fileName }) {
  if (!chatStore.currentRoom) return

  sendMessage({
    roomId: chatStore.currentRoom.roomId,
    senderId: chatStore.currentUser.id,
    messageType,
    content,
    fileUrl,
    fileName,
  })
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f7f8fa;
}

.no-room,
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
