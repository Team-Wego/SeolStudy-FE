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
          @click="openTimeModal">
          <Clock :size="16" color="#333" />
          공부 기록 추가
        </button>
      </div>
    </Transition>

    <!-- 시간 추가 모달 오버레이 -->
    <Transition name="overlay">
      <div v-if="showTimeModal" class="fixed inset-0 z-40 bg-black/50" @click="closeTimeModal" />
    </Transition>

    <!-- 시간 추가 모달 -->
    <Transition name="popup">
      <div v-if="showTimeModal" class="fixed z-50 bg-white rounded-3xl shadow-lg"
        style="top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 24px; width: 320px;">

        <h2 class="font-bold" style="font-size: 16px; margin-bottom: 20px;">시간 추가</h2>

        <!-- 할 일 선택 -->
        <div style="margin-bottom: 20px;">
          <label class="block font-semibold" style="font-size: 13px; margin-bottom: 8px; color: #333;">할 일 선택</label>
          <el-select v-model="form.taskId" placeholder="할 일을 선택해주세요" class="w-full" size="large">
            <el-option v-for="task in todayTasks" :key="task.id" :label="task.title" :value="task.id" />
          </el-select>
        </div>

        <!-- 시작 시간 -->
        <div style="margin-bottom: 16px;">
          <label class="block font-semibold" style="font-size: 13px; margin-bottom: 8px; color: #333;">시작</label>
          <div class="flex items-center gap-2">
            <div class="flex rounded-full" style="padding: 2px; background: #F3F4F6;">
              <button class="font-medium rounded-full transition-colors" :style="{
                padding: '6px 12px', fontSize: '13px',
                background: form.startPeriod === '오전' ? 'white' : 'transparent',
                color: form.startPeriod === '오전' ? '#333' : '#8E8E93',
                boxShadow: form.startPeriod === '오전' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }" @click="form.startPeriod = '오전'">오전</button>
              <button class="font-medium rounded-full transition-colors" :style="{
                padding: '6px 12px', fontSize: '13px',
                background: form.startPeriod === '오후' ? 'white' : 'transparent',
                color: form.startPeriod === '오후' ? '#333' : '#8E8E93',
                boxShadow: form.startPeriod === '오후' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }" @click="form.startPeriod = '오후'">오후</button>
            </div>
            <input v-model="form.startHour" type="number" min="1" max="12" placeholder="시"
              class="w-14 text-center outline-none bg-[#F5F5F5]"
              style="padding: 8px 4px; border-radius: 12px; font-size: 14px;" />
            <span class="text-[#8E8E93]" style="font-size: 14px;">:</span>
            <input v-model="form.startMinute" type="number" min="0" max="59" placeholder="분"
              class="w-14 text-center outline-none bg-[#F5F5F5]"
              style="padding: 8px 4px; border-radius: 12px; font-size: 14px;" />
          </div>
        </div>

        <!-- 종료 시간 -->
        <div style="margin-bottom: 16px;">
          <label class="block font-semibold" style="font-size: 13px; margin-bottom: 8px; color: #333;">종료</label>
          <div class="flex items-center gap-2">
            <div class="flex rounded-full" style="padding: 2px; background: #F3F4F6;">
              <button class="font-medium rounded-full transition-colors" :style="{
                padding: '6px 12px', fontSize: '13px',
                background: form.endPeriod === '오전' ? 'white' : 'transparent',
                color: form.endPeriod === '오전' ? '#333' : '#8E8E93',
                boxShadow: form.endPeriod === '오전' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }" @click="form.endPeriod = '오전'">오전</button>
              <button class="font-medium rounded-full transition-colors" :style="{
                padding: '6px 12px', fontSize: '13px',
                background: form.endPeriod === '오후' ? 'white' : 'transparent',
                color: form.endPeriod === '오후' ? '#333' : '#8E8E93',
                boxShadow: form.endPeriod === '오후' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }" @click="form.endPeriod = '오후'">오후</button>
            </div>
            <input v-model="form.endHour" type="number" min="1" max="12" placeholder="시"
              class="w-14 text-center outline-none bg-[#F5F5F5]"
              style="padding: 8px 4px; border-radius: 12px; font-size: 14px;" />
            <span class="text-[#8E8E93]" style="font-size: 14px;">:</span>
            <input v-model="form.endMinute" type="number" min="0" max="59" placeholder="분"
              class="w-14 text-center outline-none bg-[#F5F5F5]"
              style="padding: 8px 4px; border-radius: 12px; font-size: 14px;" />
          </div>
        </div>

        <!-- 에러 메시지 -->
        <p v-if="errorMessage" class="text-red-500 text-center" style="font-size: 13px; margin-bottom: 12px;">
          {{ errorMessage }}
        </p>

        <!-- 버튼 영역 -->
        <div class="flex gap-3" style="margin-top: 8px;">
          <button class="flex-1 font-semibold border border-[#E5E5EA] text-[#8E8E93] transition-colors"
            style="padding: 14px; border-radius: 14px; font-size: 15px;" @click="closeTimeModal">
            취소
          </button>
          <button class="flex-1 font-semibold text-white transition-colors"
            :class="isFormValid && !submitting ? 'bg-[#333]' : 'bg-[#D1D1D6] cursor-not-allowed'"
            :disabled="!isFormValid || submitting" style="padding: 14px; border-radius: 14px; font-size: 15px;"
            @click="handleTimeSubmit">
            {{ submitting ? '등록 중...' : '추가' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- FAB 버튼 -->
    <button
      class="fixed z-30 flex items-center justify-center rounded-full bg-[#0CA5FE] shadow-lg transition-transform active:scale-95"
      style="width: 52px; height: 52px; right: 20px; bottom: 100px;" @click="showMenu = !showMenu">
      <Plus :size="24" color="white" :stroke-width="2.5" />
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Edit3, Clock } from 'lucide-vue-next'
import { getCookie } from '@/utils/cookie'
import { getDailyTasks, createStudyTime, getDailyStudyTimes } from '@/api/task/taskApi'

const router = useRouter()
const showMenu = ref(false)

// 시간 추가 모달
const showTimeModal = ref(false)
const todayTasks = ref([])
const existingStudyTimes = ref([])
const submitting = ref(false)
const errorMessage = ref('')

const form = reactive({
  taskId: null,
  startPeriod: '오전',
  startHour: '',
  startMinute: '',
  endPeriod: '오전',
  endHour: '',
  endMinute: '',
})

const isFormValid = computed(() => {
  return form.taskId !== null && form.startHour !== '' && form.startMinute !== '' && form.endHour !== '' && form.endMinute !== ''
})

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function to24Hour(period, hour) {
  const h = parseInt(hour, 10)
  if (period === '오전') return h === 12 ? 0 : h
  return h === 12 ? 12 : h + 12
}

function buildLocalDateTime(period, hour, minute) {
  const h24 = to24Hour(period, hour)
  return `${todayStr()}T${String(h24).padStart(2, '0')}:${String(parseInt(minute, 10)).padStart(2, '0')}:00`
}

function checkOverlap(newStart, newEnd) {
  for (const st of existingStudyTimes.value) {
    const existStart = new Date(st.startedAt).getTime()
    const existEnd = new Date(st.endedAt).getTime()
    if (newStart < existEnd && newEnd > existStart) return true
  }
  return false
}

function goToTaskCreate() {
  showMenu.value = false
  router.push('/mentee/tasks/create')
}

async function openTimeModal() {
  showMenu.value = false
  errorMessage.value = ''
  form.taskId = null
  form.startPeriod = '오전'
  form.startHour = ''
  form.startMinute = ''
  form.endPeriod = '오전'
  form.endHour = ''
  form.endMinute = ''

  const menteeId = getCookie('memberId')
  if (!menteeId) return

  try {
    const [tasksRes, studyTimesRes] = await Promise.all([
      getDailyTasks(Number(menteeId), todayStr()),
      getDailyStudyTimes(Number(menteeId), todayStr()),
    ])
    todayTasks.value = tasksRes.data
    existingStudyTimes.value = studyTimesRes.data.studyTimes || []
  } catch (e) {
    console.error('데이터 조회 실패:', e)
    todayTasks.value = []
    existingStudyTimes.value = []
  }

  showTimeModal.value = true
}

function closeTimeModal() {
  showTimeModal.value = false
  errorMessage.value = ''
}

async function handleTimeSubmit() {
  if (!isFormValid.value || submitting.value) return

  errorMessage.value = ''

  const startedAt = buildLocalDateTime(form.startPeriod, form.startHour, form.startMinute)
  const endedAt = buildLocalDateTime(form.endPeriod, form.endHour, form.endMinute)

  const startTime = new Date(startedAt).getTime()
  const endTime = new Date(endedAt).getTime()

  if (endTime <= startTime) {
    errorMessage.value = '종료 시간이 시작 시간보다 빨라요.'
    return
  }

  if (checkOverlap(startTime, endTime)) {
    errorMessage.value = '기존 공부 시간과 겹쳐요.'
    return
  }

  submitting.value = true
  const menteeId = getCookie('memberId')

  try {
    await createStudyTime(Number(menteeId), { taskId: form.taskId, startedAt, endedAt })
    closeTimeModal()
  } catch (e) {
    console.error('공부 시간 등록 실패:', e)
    errorMessage.value = '등록에 실패했습니다.'
  } finally {
    submitting.value = false
  }
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
