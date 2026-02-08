<template>
  <div class="flex flex-col h-dvh bg-[#F3F4F6]">
    <!-- 헤더 -->
    <header class="flex items-center relative shrink-0 bg-[#F3F4F6]" style="padding: 16px 20px;">
      <button class="absolute left-5" @click="$router.back()">
        <ChevronLeft :size="24" color="#333" />
      </button>
      <h1 class="flex-1 text-center font-bold" style="font-size: 16px;">나의 목표</h1>
    </header>

    <!-- 목표 리스트 -->
    <div class="flex-1 overflow-y-auto" style="padding: 20px;">
      <!-- D-day 카드 -->
      <div v-if="member" class="bg-white rounded-2xl" style="padding: 24px; margin-bottom: 16px;">
        <p class="text-[#4AF38A] font-bold" style="font-size: 28px; margin-bottom: 8px;">
          D-{{ dDay }}
        </p>
        <p class="text-black" style="font-size: 14px;">
          목표: {{ member.goalUniversity || '목표 대학을 설정해주세요' }}
        </p>
      </div>

      <!-- 목표 아이템들 -->
      <div v-for="goal in goals" :key="goal.goalId" class="flex items-center bg-white rounded-2xl"
        style="padding: 18px 16px; margin-bottom: 10px;">
        <SubjectTag :subject="subjectMap[goal.subject] || 'korean'" size="sm" />
        <span class="flex-1 font-medium" style="font-size: 14px; margin-left: 12px;">{{ goal.name }}</span>
        <MoreVertical :size="18" color="#C7C7CC" />
      </div>

      <!-- 빈 상태 -->
      <div v-if="!loading && goals.length === 0" class="flex flex-col items-center justify-center"
        style="padding-top: 80px;">
        <p class="text-[#8E8E93]" style="font-size: 14px;">등록된 목표가 없습니다.</p>
      </div>
    </div>

    <!-- FAB -->
    <button
      class="fixed z-30 flex items-center justify-center rounded-full bg-[#0CA5FE] shadow-lg transition-transform active:scale-95"
      style="width: 52px; height: 52px; right: 20px; bottom: 32px;" @click="showModal = true">
      <Plus :size="24" color="white" :stroke-width="2.5" />
    </button>

    <!-- 목표 추가 모달 -->
    <Transition name="overlay">
      <div v-if="showModal" class="fixed inset-0 z-40 bg-black/50" @click="closeModal" />
    </Transition>
    <Transition name="modal">
      <div v-if="showModal" class="fixed z-50 bg-white rounded-2xl shadow-xl"
        style="top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 28px 24px; width: calc(100% - 80px); max-width: 320px;">
        <h2 class="font-bold" style="font-size: 16px; margin-bottom: 20px;">새 목표 추가</h2>

        <!-- 과목 -->
        <p class="font-semibold" style="font-size: 13px; margin-bottom: 10px;">과목</p>
        <div class="flex gap-2" style="margin-bottom: 20px;">
          <button v-for="subj in subjects" :key="subj.value" class="font-medium transition-colors" :class="modalForm.subject === subj.value
            ? 'bg-[#0CA5FE] text-white'
            : 'bg-white text-[#8E8E93] border border-[#E5E5EA]'"
            :style="{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px' }"
            @click="modalForm.subject = subj.value">
            {{ subj.label }}
          </button>
        </div>

        <!-- 목표 내용 -->
        <p class="font-semibold" style="font-size: 13px; margin-bottom: 10px;">목표 내용</p>
        <input v-model="modalForm.name" type="text" placeholder="어떤 목표를 이룰까요?"
          class="w-full outline-none border border-[#E5E5EA] text-sm"
          style="padding: 12px 14px; border-radius: 12px; font-size: 14px; margin-bottom: 24px;" />

        <!-- 버튼 -->
        <div class="flex gap-3">
          <button class="flex-1 font-medium border border-[#E5E5EA] text-[#8E8E93]"
            style="padding: 12px; border-radius: 12px; font-size: 14px;" @click="closeModal">
            취소
          </button>
          <button class="flex-1 font-bold text-white transition-colors"
            :class="isModalValid ? 'bg-[#222]' : 'bg-[#D1D1D6] cursor-not-allowed'"
            :disabled="!isModalValid || submitting" style="padding: 12px; border-radius: 12px; font-size: 14px;"
            @click="handleCreate">
            저장
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ChevronLeft, Plus, MoreVertical } from 'lucide-vue-next'
import SubjectTag from '@/components/common/SubjectTag.vue'
import { getCookie } from '@/utils/cookie'
import { getGoals, createGoal } from '@/api/mentoring/goalApi'
import { getMember } from '@/api/member/memberApi'

const goals = ref([])
const member = ref(null)
const loading = ref(true)
const showModal = ref(false)
const submitting = ref(false)

const subjects = [
  { label: '국어', value: 'korean' },
  { label: '영어', value: 'english' },
  { label: '수학', value: 'math' },
]

const subjectToEnum = {
  korean: 'KOR',
  english: 'ENG',
  math: 'MATH',
}

const subjectMap = {
  KOR: 'korean',
  ENG: 'english',
  MATH: 'math',
}

const modalForm = reactive({
  name: '',
  subject: null,
})

const isModalValid = computed(() => modalForm.name.trim() && modalForm.subject)

// 학년 기반 수능 D-day 계산
const dDay = computed(() => {
  if (!member.value?.grade) return '?'

  const now = new Date()
  const year = now.getFullYear()

  // 11월 셋째 목요일 계산
  function getCsatDate(y) {
    const nov1 = new Date(y, 10, 1)
    const day = nov1.getDay()
    const firstThu = day <= 4 ? (4 - day + 1) : (11 - day + 1)
    return new Date(y, 10, firstThu + 14)
  }

  const yearMap = { HIGH_3: year, HIGH_2: year + 1, HIGH_1: year + 2, N_STUDENT: year }
  const csatDate = getCsatDate(yearMap[member.value.grade] || year)
  const diff = Math.ceil((csatDate - now) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
})

onMounted(async () => {
  const menteeId = getCookie('memberId')
  await Promise.all([
    fetchGoals(),
    fetchMember(Number(menteeId)),
  ])
})

async function fetchMember(memberId) {
  try {
    const { data } = await getMember(memberId)
    member.value = data
  } catch (e) {
    console.error('회원 정보 조회 실패:', e)
  }
}

async function fetchGoals() {
  loading.value = true
  const menteeId = getCookie('memberId')
  try {
    const { data } = await getGoals(Number(menteeId))
    goals.value = data
  } catch (e) {
    console.error('목표 목록 조회 실패:', e)
  } finally {
    loading.value = false
  }
}

function closeModal() {
  showModal.value = false
  modalForm.name = ''
  modalForm.subject = null
}

async function handleCreate() {
  if (!isModalValid.value || submitting.value) return

  submitting.value = true
  const menteeId = Number(getCookie('memberId'))

  try {
    await createGoal(menteeId, modalForm.name.trim(), subjectToEnum[modalForm.subject])
    closeModal()
    await fetchGoals()
  } catch (e) {
    console.error('목표 등록 실패:', e)
    alert('목표 등록에 실패했습니다.')
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

.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9) !important;
}
</style>
