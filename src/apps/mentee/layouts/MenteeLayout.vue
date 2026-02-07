<template>
  <div class="flex flex-col h-dvh bg-white">
    <!-- 콘텐츠 영역 -->
    <main class="flex-1 overflow-y-auto pb-16">
      <RouterView />
    </main>

    <!-- 하단 탭바 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <ul class="flex justify-around items-center h-16 max-w-screen-sm mx-auto">
        <li v-for="tab in tabs" :key="tab.name">
          <RouterLink
            :to="tab.to"
            class="flex flex-col items-center gap-1 px-3 py-2"
            :class="isActive(tab.to) ? 'text-blue-600' : 'text-gray-400'"
          >
            <component :is="tab.icon" :size="22" :stroke-width="isActive(tab.to) ? 2.5 : 1.8" />
            <span class="text-[10px] font-medium">{{ tab.label }}</span>
          </RouterLink>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { Home, Calendar, MessageSquareText, MessagesSquare, User } from 'lucide-vue-next'

const tabs = [
  { name: 'home', label: '홈', to: '/mentee/home', icon: Home },
  { name: 'calendar', label: '캘린더', to: '/mentee/calendar', icon: Calendar },
  { name: 'feedback', label: '피드백', to: '/mentee/feedback', icon: MessageSquareText },
  { name: 'chat', label: '채팅', to: '/mentee/chat', icon: MessagesSquare },
  { name: 'mypage', label: '마이페이지', to: '/mentee/mypage', icon: User },
]

const route = useRoute()

function isActive(to) {
  return route.path.startsWith(to)
}
</script>
