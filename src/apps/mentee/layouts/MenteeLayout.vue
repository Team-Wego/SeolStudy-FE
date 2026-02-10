<template>
  <div class="flex flex-col h-dvh bg-white">
    <!-- 상단 헤더 -->
    <header class="shrink-0 flex items-center justify-between" style="padding: 12px 20px;">
      <span class="font-bold" style="font-size: 16px;">SeolStudy</span>
      <div class="flex items-center gap-3">
        <button class="border border-[#0CA5FE] text-[#0CA5FE] font-semibold rounded-full"
          style="padding: 4px 14px; font-size: 12px;" @click="$router.push('/mentee/goals')">
          목표
        </button>
        <NotificationDropdown />
      </div>
    </header>

    <!-- 콘텐츠 영역 -->
    <main class="flex-1 overflow-y-auto" style="padding-bottom: 94px;">
      <RouterView />
    </main>

    <!-- 하단 탭바 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white z-[10]" style="padding: 20px 24px;">
      <div class="flex items-center justify-between max-w-screen-sm mx-auto" style="gap: 37px;">
        <RouterLink v-for="tab in tabs" :key="tab.name" :to="tab.to"
          class="flex flex-col items-center gap-[2px] relative">
          <div class="flex items-center justify-center w-[38px] h-[40px] relative">
            <component :is="tab.icon" :size="20" :color="isActive(tab.to) ? '#0CA5FE' : '#A6A6A6'"
              :stroke-width="1.8" />
            <!-- 채팅 탭 읽지 않은 메시지 뱃지 -->
            <span v-if="tab.name === 'chat' && chatStore.unreadCount > 0" class="unread-badge">
              {{ chatStore.unreadCount > 99 ? '99+' : chatStore.unreadCount }}
            </span>
          </div>
          <span class="text-[10px] leading-[12px] text-center" :class="tab.name === 'mypage' ? 'w-[44px]' : 'w-[38px]'"
            :style="{ color: isActive(tab.to) ? '#0CA5FE' : '#A6A6A6' }">
            {{ tab.label }}
          </span>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useChatStore } from '@/stores/chatStore'
import { getMenteeRooms, getUnreadCount } from '@/api/chat/chatApi'

const POLL_INTERVAL = 5000 // 5초마다 폴링
import { Home, Calendar, MessageSquareText, MessagesSquare, User } from 'lucide-vue-next'
import NotificationDropdown from '@/components/NotificationDropdown.vue'


const tabs = [
  { name: 'calendar', label: '캘린더', to: '/mentee/calendar', icon: Calendar },
  { name: 'feedback', label: '피드백', to: '/mentee/feedback', icon: MessageSquareText },
  { name: 'home', label: '홈', to: '/mentee/home', icon: Home },
  { name: 'chat', label: '채팅', to: '/mentee/chat', icon: MessagesSquare },
  { name: 'mypage', label: '마이페이지', to: '/mentee/mypage', icon: User },
]

const route = useRoute()
const chatStore = useChatStore()
const cachedRoomId = ref(null)
let pollTimer = null

function isActive(to) {
  return route.path.startsWith(to)
}

// 읽지 않은 메시지 수 조회
async function fetchUnreadCount() {
  // 채팅 화면에 있으면 폴링 건너뛰기 (이미 읽고 있는 중)
  if (route.path.startsWith('/mentee/chat')) return

  try {
    const userId = chatStore.currentUser.id
    if (!userId) return

    // roomId를 캐싱하여 매번 방 목록을 조회하지 않음
    if (!cachedRoomId.value) {
      const { data: rooms } = await getMenteeRooms(userId)
      if (!rooms || rooms.length === 0) return
      cachedRoomId.value = rooms[0].roomId
    }

    const { data: count } = await getUnreadCount(cachedRoomId.value, userId)
    chatStore.setUnreadCount(count)
  } catch (err) {
    console.error('[Badge] 읽지 않은 메시지 수 조회 실패:', err)
  }
}

// 폴링 시작
function startPolling() {
  stopPolling()
  pollTimer = setInterval(fetchUnreadCount, POLL_INTERVAL)
}

// 폴링 중지
function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// 레이아웃 진입 시 초기 조회 + 폴링 시작
onMounted(() => {
  fetchUnreadCount()
  startPolling()
})

// 레이아웃 언마운트 시 폴링 중지
onUnmounted(() => {
  stopPolling()
})

// 채팅 탭 진입 시 뱃지 초기화, 다른 탭 이동 시 즉시 조회
watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/mentee/chat')) {
      chatStore.setUnreadCount(0)
    } else {
      fetchUnreadCount()
    }
  },
)
</script>

<style scoped>
.unread-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #FF3B30;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  border-radius: 9px;
  box-sizing: border-box;
}
</style>
