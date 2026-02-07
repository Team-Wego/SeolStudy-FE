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
          class="flex items-center gap-3 px-5 py-4 rounded-lg text-base font-medium transition-colors"
          :class="isActive(menu.to)
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-600 hover:bg-gray-100'"
        >
          <component :is="menu.icon" :size="20" />
          <span>{{ menu.label }}</span>
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
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, Users, LogOut } from 'lucide-vue-next'
import { removeCookie } from '@/utils/cookie'

const router = useRouter()

const menus = [
  { name: 'dashboard', label: '대시보드', to: '/mentor/dashboard', icon: LayoutDashboard },
  { name: 'mentee-list', label: '담당 멘티 목록', to: '/mentor/mentees', icon: Users },
]

const route = useRoute()

function isActive(to) {
  return route.path.startsWith(to)
}

function handleLogout() {
  removeCookie('memberId')
  removeCookie('memberRole')
  removeCookie('memberName')
  router.push('/login')
}
</script>
