import { ref, onUnmounted } from 'vue'
import SockJS from 'sockjs-client/dist/sockjs'
import Stomp from 'stompjs'
import { useChatStore } from '@/stores/chatStore'

export function useChat() {
  const chatStore = useChatStore()
  let stompClient = null
  let roomSubscription = null

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

  // WebSocket 연결
  function connect() {
    return new Promise((resolve, reject) => {
      const socket = new SockJS(`${API_BASE}/ws/chat`)
      stompClient = Stomp.over(socket)
      stompClient.debug = null // 콘솔 로그 비활성화

      stompClient.connect(
        {},
        () => {
          chatStore.isConnected = true
          console.log('[Chat] WebSocket 연결됨')
          resolve()
        },
        (error) => {
          chatStore.isConnected = false
          console.error('[Chat] WebSocket 연결 실패:', error)
          reject(error)
        },
      )
    })
  }

  // WebSocket 해제
  function disconnect() {
    if (roomSubscription) {
      roomSubscription.unsubscribe()
      roomSubscription = null
    }
    if (stompClient) {
      stompClient.disconnect(() => {
        chatStore.isConnected = false
        console.log('[Chat] WebSocket 연결 해제')
      })
      stompClient = null
    }
  }

  // 채팅방 구독
  function subscribeRoom(roomId, onMessage) {
    if (!stompClient) return

    // 기존 구독 해제
    if (roomSubscription) {
      roomSubscription.unsubscribe()
    }

    roomSubscription = stompClient.subscribe(`/sub/chat/room/${roomId}`, (message) => {
      const msg = JSON.parse(message.body)
      onMessage(msg)
    })
  }

  // 입장 알림 (읽음 처리)
  function enterRoom(roomId, userId) {
    if (!stompClient) return
    stompClient.send(
      '/pub/chat/enter',
      {},
      JSON.stringify({ roomId, userId }),
    )
  }

  // 메시지 전송
  function sendMessage({ roomId, senderId, messageType, content, fileUrl, fileName }) {
    if (!stompClient) return
    stompClient.send(
      '/pub/chat/message',
      {},
      JSON.stringify({ roomId, senderId, messageType, content, fileUrl, fileName }),
    )
  }

  // 컴포넌트 언마운트 시 자동 정리
  onUnmounted(() => {
    disconnect()
  })

  return {
    connect,
    disconnect,
    subscribeRoom,
    enterRoom,
    sendMessage,
  }
}
