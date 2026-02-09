<template>
  <div class="layout-wrap">
    <!-- 사이드바 -->
    <aside class="sidebar">
      <!-- 로고 -->
      <div class="sidebar-logo">SeolStudy</div>

      <!-- 멘토 프로필 + 알림 -->
      <div class="mentor-profile">
        <img
          v-if="mentorInfo.profileUrl"
          :src="mentorInfo.profileUrl"
          class="mentor-avatar"
          alt="프로필"
        />
        <div v-else class="mentor-avatar mentor-avatar-placeholder">
          <User :size="24" color="#999" />
        </div>
        <div class="mentor-text">
          <span class="mentor-name">{{ mentorInfo.name || '' }} 멘토님</span>
          <span class="mentor-school">{{ mentorInfo.goalUniversity || '' }}</span>
        </div>
        <div class="mentor-noti">
          <NotificationDropdown />
        </div>
      </div>

      <div class="sidebar-divider" />

      <!-- 메뉴 -->
      <nav class="sidebar-nav">
        <RouterLink
          v-for="menu in menus"
          :key="menu.name"
          :to="menu.to"
          class="nav-item"
          :class="{ active: isActive(menu.to) }"
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
      <div class="sidebar-bottom">
        <button class="logout-btn" @click="handleLogout">
          <LogOut :size="18" />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, Users, MessageSquare, LogOut, User } from 'lucide-vue-next'
import NotificationDropdown from '@/components/NotificationDropdown.vue'
import { removeCookie, getCookie } from '@/utils/cookie'
import { getMentorRooms } from '@/api/chat/chatApi'
import { getMember } from '@/api/member/memberApi'
import { useChatStore } from '@/stores/chatStore'

const router = useRouter()
const route = useRoute()
const chatStore = useChatStore()

const mentorInfo = ref({})

const menus = [
  { name: 'dashboard', label: '대시보드', to: '/mentor/dashboard', icon: LayoutDashboard },
  { name: 'mentee-list', label: '담당 멘티 목록', to: '/mentor/mentees', icon: Users },
  { name: 'chat', label: '채팅', to: '/mentor/chat', icon: MessageSquare },
]

const totalUnread = ref(0)
let pollTimer = null
const POLL_INTERVAL = 5000

function isActive(to) {
  return route.path.startsWith(to)
}

async function fetchMentorInfo() {
  const memberId = getCookie('memberId')
  if (!memberId) return
  try {
    const { data } = await getMember(Number(memberId))
    mentorInfo.value = data
  } catch {
    // 무시
  }
}

async function fetchUnreadCount() {
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

watch(() => route.path, (newPath, oldPath) => {
  if (oldPath?.startsWith('/mentor/chat') && !newPath.startsWith('/mentor/chat')) {
    fetchUnreadCount()
  }
  if (newPath.startsWith('/mentor/chat')) {
    totalUnread.value = 0
  }
})

onMounted(() => {
  fetchMentorInfo()
  fetchUnreadCount()
  pollTimer = setInterval(fetchUnreadCount, POLL_INTERVAL)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

function handleLogout() {
  chatStore.reset()
  removeCookie('memberId')
  removeCookie('memberRole')
  removeCookie('memberName')
  router.push('/login')
}
</script>

<style scoped>
.layout-wrap {
  display: flex;
  height: 100dvh;
  background: #f5f5f5;
}

/* 사이드바 */
.sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  padding: 32px 24px 20px;
}

.sidebar-logo {
  font-size: 22px;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 28px;
}

/* 멘토 프로필 */
.mentor-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.mentor-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.mentor-avatar-placeholder {
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mentor-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mentor-name {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mentor-school {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mentor-noti {
  margin-left: auto;
  flex-shrink: 0;
}

.mentor-noti :deep(.dropdown) {
  right: auto;
  left: 0;
}

.sidebar-divider {
  height: 1px;
  background: #eee;
  margin-bottom: 20px;
}

/* 네비게이션 */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #666;
  text-decoration: none;
  transition: all 0.15s;
}

.nav-item:hover {
  background: #f5f5f5;
}

.nav-item.active {
  color: #3aafe0;
  background: transparent;
}

/* 로그아웃 */
.sidebar-bottom {
  border-top: 1px solid #eee;
  padding-top: 16px;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  width: 100%;
  border: none;
  background: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #999;
  cursor: pointer;
  transition: background 0.15s;
}

.logout-btn:hover {
  background: #f5f5f5;
}

/* 메인 */
.main-content {
  flex: 1;
  overflow-y: auto;
}

/* 뱃지 */
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
