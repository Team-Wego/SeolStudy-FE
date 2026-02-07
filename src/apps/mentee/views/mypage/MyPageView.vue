<template>
  <div class="p-4">
    <h1 class="text-xl font-bold">마이페이지</h1>

    <button
      @click="handleLogout"
      class="mt-6 flex items-center gap-2 px-4 py-3 w-full rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
    >
      <LogOut :size="18" />
      <span>로그아웃</span>
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { LogOut } from 'lucide-vue-next'
import { removeCookie } from '@/utils/cookie'

const router = useRouter()

function handleLogout() {
  removeCookie('memberId')
  removeCookie('memberRole')
  removeCookie('memberName')
  router.push('/login')
}
</script>
