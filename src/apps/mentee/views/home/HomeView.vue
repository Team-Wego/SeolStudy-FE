<template>
  <div class="relative h-full">
    <div class="p-4">
      <h1 class="text-xl font-bold">홈</h1>
    </div>

    <!-- 오버레이 (배경 fadeout) -->
    <Transition name="overlay">
      <div v-if="showMenu" class="fixed inset-0 z-40 bg-black/50" @click="showMenu = false" />
    </Transition>

    <!-- 팝업 메뉴 (화면 중앙) -->
    <Transition name="popup">
      <div v-if="showMenu" class="fixed z-50 bg-white rounded-3xl shadow-lg"
        style="top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 24px 24px; min-width: 225px;">
        <button class="flex items-center justify-center gap-3 w-full text-sm text-gray-800" style="padding: 12px 0;"
          @click="goToTaskCreate">
          <Edit3 :size="16" color="#333" />
          할 일 추가
        </button>
        <div class="border-t border-gray-100" />
        <button class="flex items-center justify-center gap-3 w-full text-sm text-gray-800" style="padding: 12px 0;"
          @click="showMenu = false">
          <Clock :size="16" color="#333" />
          시간 추가
        </button>
      </div>
    </Transition>

    <!-- FAB 버튼 -->
    <button
      class="fixed z-30 flex items-center justify-center rounded-full bg-[#E8E8E8] shadow-md transition-transform active:scale-95"
      style="width: 36px; height: 36px; right: 20px; bottom: 110px;" @click="showMenu = !showMenu">
      <Plus :size="16" color="#888" :stroke-width="2.5" />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Edit3, Clock } from 'lucide-vue-next'

const router = useRouter()
const showMenu = ref(false)

function goToTaskCreate() {
  showMenu.value = false
  router.push('/mentee/tasks/create')
}
</script>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.25s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.popup-enter-active,
.popup-leave-active {
  transition: all 0.2s ease;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9) !important;
}
</style>
