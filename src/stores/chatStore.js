import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCookie } from '@/utils/cookie'

export const useChatStore = defineStore('chat', () => {
  // 현재 사용자 (쿠키에서 명시적으로 로드)
  const currentUser = ref({
    id: null,
    name: '',
    role: '',
  })

  // 쿠키에서 사용자 정보를 다시 읽어옴
  function loadCurrentUser() {
    currentUser.value = {
      id: Number(getCookie('memberId')),
      name: getCookie('memberName') || '',
      role: getCookie('memberRole') || '',
    }
  }

  // 채팅방 정보
  const currentRoom = ref(null)

  // 메시지 목록
  const messages = ref([])

  // WebSocket 연결 상태
  const isConnected = ref(false)

  // 로딩 상태
  const isLoading = ref(false)

  // 읽지 않은 메시지 수
  const unreadCount = ref(0)

  // 메시지 추가 (실시간 수신)
  function addMessage(message) {
    const exists = messages.value.some((m) => m.messageId === message.messageId)
    if (!exists) {
      messages.value.push(message)
    }
  }

  // 메시지 목록 세팅 (이력 로드)
  function setMessages(msgList) {
    messages.value = msgList
  }

  // 읽지 않은 메시지 수 설정
  function setUnreadCount(count) {
    unreadCount.value = count
  }

  // 초기화
  function reset() {
    currentRoom.value = null
    messages.value = []
    isConnected.value = false
    isLoading.value = false
    unreadCount.value = 0
    loadCurrentUser()
  }

  return {
    currentUser,
    currentRoom,
    messages,
    isConnected,
    isLoading,
    unreadCount,
    addMessage,
    setMessages,
    setUnreadCount,
    loadCurrentUser,
    reset,
  }
})
