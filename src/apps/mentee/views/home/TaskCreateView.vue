<template>
  <div class="flex flex-col h-dvh bg-white">
    <!-- 헤더 -->
    <header class="flex items-center relative shrink-0" style="padding: 16px 20px;">
      <button class="absolute left-5" @click="goBack">
        <ChevronLeft :size="24" color="#333" />
      </button>
      <h1 class="flex-1 text-center font-bold" style="font-size: 16px;">할 일 기록</h1>
    </header>

    <!-- 폼 -->
    <div class="flex-1 overflow-y-auto" style="padding: 0 20px 40px;">
      <!-- 할 일 -->
      <section style="margin-bottom: 32px;">
        <label class="block font-semibold" style="font-size: 14px; margin-bottom: 12px;">할 일 <span class="text-red-500">*</span></label>
        <input
          v-model="form.title"
          type="text"
          placeholder="할 일을 입력해주세요."
          class="w-full outline-none bg-[#F5F5F5] text-sm"
          style="padding: 16px; border-radius: 16px; font-size: 14px;"
        />
      </section>

      <!-- 과목 -->
      <section style="margin-bottom: 32px;">
        <label class="block font-semibold" style="font-size: 14px; margin-bottom: 12px;">과목 <span class="text-red-500">*</span></label>
        <div class="flex gap-2">
          <button
            v-for="subj in subjects"
            :key="subj.value"
            class="font-medium transition-colors"
            :class="form.subject === subj.value
              ? 'bg-[#0CA5FE] text-white'
              : 'bg-white text-[#8E8E93] border border-[#E5E5EA]'"
            :style="{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px' }"
            @click="form.subject = subj.value"
          >
            {{ subj.label }}
          </button>
        </div>
      </section>

      <!-- 목표 -->
      <section style="margin-bottom: 32px;">
        <label class="block font-semibold" style="font-size: 14px; margin-bottom: 12px;">목표</label>
        <el-select
          v-model="form.goalId"
          placeholder="목표를 선택해주세요."
          clearable
          class="w-full"
          size="large"
        >
          <el-option
            v-for="goal in goals"
            :key="goal.goalId"
            :label="goal.name"
            :value="goal.goalId"
          />
        </el-select>
      </section>

      <!-- 내용 -->
      <section style="margin-bottom: 32px;">
        <label class="block font-semibold" style="font-size: 14px; margin-bottom: 12px;">내용</label>
        <textarea
          v-model="form.description"
          placeholder="내용을 입력해주세요."
          rows="6"
          class="w-full outline-none bg-[#F5F5F5] text-sm resize-none"
          style="padding: 16px; border-radius: 16px; font-size: 14px; line-height: 1.6;"
        />
      </section>
    </div>

    <!-- 하단 버튼 -->
    <div class="shrink-0" style="padding: 16px 20px 32px;">
      <button
        class="w-full text-white font-bold transition-colors"
        :class="isValid ? 'bg-[#0CA5FE]' : 'bg-[#D1D1D6] cursor-not-allowed'"
        :disabled="!isValid || submitting"
        style="padding: 18px; border-radius: 16px; font-size: 16px;"
        @click="handleSubmit"
      >
        {{ submitting ? '등록 중...' : '등록하기' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import { getCookie } from '@/utils/cookie'
import { createTask } from '@/api/task/taskApi'
import { getGoals } from '@/api/mentoring/goalApi'

const router = useRouter()

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

const form = reactive({
  title: '',
  subject: null,
  goalId: null,
  description: '',
})

const goals = ref([])
const submitting = ref(false)

const isValid = computed(() => form.title.trim() && form.subject)

onMounted(async () => {
  const menteeId = getCookie('memberId')
  if (menteeId) {
    try {
      const { data } = await getGoals(Number(menteeId))
      goals.value = data
    } catch (e) {
      console.error('목표 목록 조회 실패:', e)
    }
  }
})

function goBack() {
  router.back()
}

async function handleSubmit() {
  if (!isValid.value || submitting.value) return

  submitting.value = true
  const menteeId = getCookie('memberId')

  const today = new Date()
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  try {
    await createTask(Number(menteeId), {
      title: form.title.trim(),
      date,
      subject: subjectToEnum[form.subject],
      description: form.description.trim() || null,
      goalId: form.goalId || null,
    })
    router.back()
  } catch (e) {
    console.error('할일 등록 실패:', e)
    alert('할일 등록에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}
</script>
