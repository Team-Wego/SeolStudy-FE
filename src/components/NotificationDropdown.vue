<template>
  <div class="notification-wrapper" ref="wrapperRef">
    <!-- 벨 아이콘 버튼 -->
    <button class="bell-btn" @click="toggle">
      <Bell :size="22" color="#333" :stroke-width="1.8" />
      <span v-if="unreadCount > 0" class="bell-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- 드롭다운 -->
    <Transition name="dropdown">
      <div v-if="open" class="dropdown">
        <div class="dropdown-header">
          <span class="dropdown-title">알림</span>
          <span v-if="unreadCount > 0" class="dropdown-unread">{{ unreadCount }}개 읽지 않음</span>
        </div>

        <div class="dropdown-body" @scroll="handleScroll">
          <div v-if="loading && notifications.length === 0" class="dropdown-empty">
            불러오는 중...
          </div>
          <div v-else-if="notifications.length === 0" class="dropdown-empty">
            알림이 없습니다
          </div>
          <template v-else>
            <div
              v-for="noti in notifications"
              :key="noti.id"
              class="noti-item"
              :class="{ unread: !noti.isRead }"
              @click="handleClick(noti)"
            >
              <div class="noti-icon">
                <MessageSquareText v-if="noti.type === 'CHAT'" :size="16" color="#0CA5FE" />
                <ClipboardCheck v-else-if="noti.type === 'TASK_REMINDER'" :size="16" color="#FF9500" />
                <MessageCircle v-else-if="noti.type === 'FEEDBACK'" :size="16" color="#34C759" />
                <BellRing v-else :size="16" color="#666" />
              </div>
              <div class="noti-content">
                <p class="noti-title">{{ noti.title }}</p>
                <p class="noti-body">{{ noti.body }}</p>
                <span class="noti-time">{{ formatTime(noti.createdAt) }}</span>
              </div>
              <div v-if="!noti.isRead" class="noti-dot" />
            </div>
            <div v-if="loading" class="dropdown-loading">불러오는 중...</div>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Bell, BellRing, MessageSquareText, ClipboardCheck, MessageCircle } from 'lucide-vue-next'
import { getCookie } from '@/utils/cookie'
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from '@/api/notification/notificationApi'

const open = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const loading = ref(false)
const currentPage = ref(0)
const hasMore = ref(true)
const wrapperRef = ref(null)

let pollTimer = null
const POLL_INTERVAL = 10000

function getMemberId() {
  return getCookie('memberId')
}

// 읽지 않은 알림 수 조회
async function fetchUnreadCount() {
  const memberId = getMemberId()
  if (!memberId) return
  try {
    const { data } = await getUnreadNotificationCount(memberId)
    unreadCount.value = data
  } catch (e) {
    console.error('[Notification] unread count 조회 실패:', e)
  }
}

// 알림 목록 조회
async function fetchNotifications(page = 0) {
  const memberId = getMemberId()
  if (!memberId || loading.value) return
  loading.value = true
  try {
    const { data } = await getNotifications(memberId, page)
    const list = data.content || data
    if (page === 0) {
      notifications.value = list
    } else {
      notifications.value.push(...list)
    }
    currentPage.value = page
    hasMore.value = Array.isArray(data.content) ? !data.last : list.length >= 20
  } catch (e) {
    console.error('[Notification] 목록 조회 실패:', e)
  } finally {
    loading.value = false
  }
}

// 드롭다운 토글
function toggle() {
  open.value = !open.value
  if (open.value) {
    currentPage.value = 0
    hasMore.value = true
    fetchNotifications(0)
  }
}

// 알림 클릭 → 읽음 처리
async function handleClick(noti) {
  if (!noti.isRead) {
    try {
      await markNotificationAsRead(noti.id)
      noti.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (e) {
      console.error('[Notification] 읽음 처리 실패:', e)
    }
  }
}

// 스크롤 → 추가 로드
function handleScroll(e) {
  const el = e.target
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20 && hasMore.value && !loading.value) {
    fetchNotifications(currentPage.value + 1)
  }
}

// 시간 포맷
function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}일 전`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 외부 클릭 닫기
function onClickOutside(e) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  fetchUnreadCount()
  pollTimer = setInterval(fetchUnreadCount, POLL_INTERVAL)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.notification-wrapper {
  position: relative;
}

.bell-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.bell-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #ff3b30;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  border-radius: 9px;
}

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  max-height: 420px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #f0f0f0;
}

.dropdown-title {
  font-size: 15px;
  font-weight: 700;
  color: #333;
}

.dropdown-unread {
  font-size: 12px;
  color: #0ca5fe;
  font-weight: 600;
}

.dropdown-body {
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
}

.dropdown-empty {
  padding: 40px 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.dropdown-loading {
  padding: 12px;
  text-align: center;
  color: #999;
  font-size: 12px;
}

.noti-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.noti-item:hover {
  background: #f8f9fa;
}

.noti-item.unread {
  background: #f0f7ff;
}

.noti-item.unread:hover {
  background: #e6f0fa;
}

.noti-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.noti-content {
  flex: 1;
  min-width: 0;
}

.noti-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin: 0 0 2px;
  line-height: 1.3;
}

.noti-body {
  font-size: 12px;
  color: #666;
  margin: 0 0 4px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.noti-time {
  font-size: 11px;
  color: #aaa;
}

.noti-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0ca5fe;
  margin-top: 6px;
}

/* 드롭다운 애니메이션 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
