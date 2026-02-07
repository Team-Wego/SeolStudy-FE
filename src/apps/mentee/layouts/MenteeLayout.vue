<template>
  <div class="flex flex-col h-dvh bg-white">
    <!-- 콘텐츠 영역 -->
    <main class="flex-1 overflow-y-auto" style="padding-bottom: 94px;">
      <RouterView />
    </main>

    <!-- 하단 탭바 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white" style="padding: 20px 24px;">
      <div class="flex items-center justify-between max-w-screen-sm mx-auto" style="gap: 37px;">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.name"
          :to="tab.to"
          class="flex flex-col items-center gap-[2px]"
        >
          <div class="flex items-center justify-center w-[38px] h-[40px]">
            <component
              :is="tab.icon"
              :size="20"
              :color="isActive(tab.to) ? '#0CA5FE' : '#A6A6A6'"
              :stroke-width="1.8"
            />
          </div>
          <span
            class="text-[10px] leading-[12px] text-center"
            :class="tab.name === 'mypage' ? 'w-[44px]' : 'w-[38px]'"
            :style="{ color: isActive(tab.to) ? '#0CA5FE' : '#A6A6A6' }"
          >
            {{ tab.label }}
          </span>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { Home, Calendar, MessageSquareText, MessagesSquare, User } from 'lucide-vue-next'

const tabs = [
  { name: 'calendar', label: '캘린더', to: '/mentee/calendar', icon: Calendar },
  { name: 'feedback', label: '피드백', to: '/mentee/feedback', icon: MessageSquareText },
  { name: 'home', label: '홈', to: '/mentee/home', icon: Home },
  { name: 'chat', label: '채팅', to: '/mentee/chat', icon: MessagesSquare },
  { name: 'mypage', label: '마이페이지', to: '/mentee/mypage', icon: User },
]

const route = useRoute()

function isActive(to) {
  return route.path.startsWith(to)
}
</script>
