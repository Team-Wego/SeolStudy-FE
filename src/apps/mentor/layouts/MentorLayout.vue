<template>
  <div class="flex h-dvh bg-gray-50">
    <!-- 사이드바 -->
    <aside class="w-60 bg-white border-r border-gray-200 flex flex-col">
      <div class="h-16 flex items-center px-6">
        <span class="text-lg font-bold text-gray-900">SeolStudy</span>
      </div>

      <nav class="flex-1 px-4 pt-6 space-y-4">
        <RouterLink
          v-for="menu in menus"
          :key="menu.name"
          :to="menu.to"
          class="relative flex items-center gap-3 px-5 py-4 rounded-lg text-base font-medium transition-colors"
          :class="isActive(menu.to)
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-600 hover:bg-gray-100'"
        >
          <component :is="menu.icon" :size="20" />
          <span>{{ menu.label }}</span>
          <span
            v-if="menu.name === 'chat' && totalUnread > 0"
            class="unread-badge"
          >
            {{ totalUnread > 99 ? '99+' : totalUnread }}
          </span>
        </RouterLink>
      </nav>

      <!-- 로그아웃 -->
      <div class="px-4 py-4 border-t border-gray-200">
        <button
          @click="handleLogout"
          class="flex items-center gap-3 px-5 py-3 w-full rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <LogOut :size="18" />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>

    <!-- 메인 콘텐츠 -->
    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, Users, MessageSquare, LogOut } from 'lucide-vue-next'
import { removeCookie, getCookie } from '@/utils/cookie'
import { getMentorRooms } from '@/api/chat/chatApi'

const router = useRouter()
const route = useRoute()

const menus = [
  { name: 'dashboard', label: '대시보드', to: '/mentor/dashboard', icon: LayoutDashboard },
  { name: 'chat', label: '채팅', to: '/mentor/chat', icon: MessageSquare },
  { name: 'mentee-list', label: '담당 멘티 목록', to: '/mentor/mentees', icon: Users },
]

const totalUnread = ref(0)
let pollTimer = null
const POLL_INTERVAL = 5000

function isActive(to) {
  return route.path.startsWith(to)
}

async function fetchUnreadCount() {
  // 채팅 페이지에 있으면 스킵
  if (route.path.startsWith('/mentor/chat')) return

  const memberId = getCookie('memberId')
  if (!memberId) return

  try {
    const { data: rooms } = await getMentorRooms(Number(memberId))
    const total = (rooms || []).reduce((sum, room) => sum + (room.mentorUnreadCount || 0), 0)
    totalUnread.value = total
  } catch {
    // 무시
  }
}

// 채팅 페이지에서 나올 때 즉시 갱신
watch(() => route.path, (newPath, oldPath) => {
  if (oldPath?.startsWith('/mentor/chat') && !newPath.startsWith('/mentor/chat')) {
    fetchUnreadCount()
  }
  if (newPath.startsWith('/mentor/chat')) {
    totalUnread.value = 0
  }
})

onMounted(() => {
  fetchUnreadCount()
  pollTimer = setInterval(fetchUnreadCount, POLL_INTERVAL)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

function handleLogout() {
  removeCookie('memberId')
  removeCookie('memberRole')
  removeCookie('memberName')
  router.push('/login')
}
</script>

<style scoped>
.unread-badge {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #FF3B30;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
  border-radius: 10px;
}
</style>
