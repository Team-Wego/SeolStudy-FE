<template>
  <div class="mentee-detail-page">
    <!-- 뒤로가기 -->
    <button class="back-btn" @click="router.back()">
      <ChevronLeft :size="20" color="#1A1A1A" />
      <span>멘티 목록</span>
    </button>

    <!-- 로딩 -->
    <div v-if="loading" class="loading-text">불러오는 중...</div>

    <template v-else>
      <!-- 탭 전환 -->
      <div class="tab-bar">
        <button class="tab-btn" :class="{ active: activeTab === 'daily' }" @click="activeTab = 'daily'">
          일일 멘토링
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'monthly' }" @click="activeTab = 'monthly'">
          월간 스케줄
        </button>
      </div>

      <!-- 2컬럼 레이아웃 -->
      <div class="detail-layout">
        <!-- 좌측 사이드바 -->
        <MenteeProfile :mentee-id="menteeId" :mentee-info="menteeInfo" />

        <!-- 우측 컨텐츠 -->
        <div class="content-area">
          <DailyMentoringTab v-if="activeTab === 'daily'" :mentee-id="menteeId" />
          <MonthlyScheduleTab v-if="activeTab === 'monthly'" :mentee-id="menteeId" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import MenteeProfile from '@/apps/mentor/components/mentee-detail/MenteeProfile.vue'
import DailyMentoringTab from '@/apps/mentor/components/mentee-detail/DailyMentoringTab.vue'
import MonthlyScheduleTab from '@/apps/mentor/components/mentee-detail/MonthlyScheduleTab.vue'
import { getMenteeList } from '@/api/mentoring/mentoringApi'

const route = useRoute()
const router = useRouter()

const menteeId = ref(route.params.menteeId)
const menteeInfo = ref(null)
const loading = ref(true)
const activeTab = ref('daily')

onMounted(async () => {
  try {
    const { data } = await getMenteeList()
    const list = data || []
    menteeInfo.value = list.find((m) => String(m.menteeId) === String(menteeId.value)) || null
  } catch (e) {
    console.error('멘티 정보 조회 실패:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.mentee-detail-page {
  padding: 24px 40px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f6f7f9;
  min-height: 100vh;
}

/* 뒤로가기 */
.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  padding: 0;
  margin-bottom: 16px;
}

/* 탭 바 */
.tab-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.tab-btn {
  padding: 10px 20px;
  border-radius: 50px;
  border: 1px solid #e5e5ea;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  color: #8e8e93;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn.active {
  background: #333;
  color: #fff;
  border-color: #333;
}

/* 레이아웃 */
.detail-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.content-area {
  flex: 1;
  min-width: 0;
}

/* 로딩 */
.loading-text {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 80px 0;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .mentee-detail-page {
    padding: 16px;
  }

  .detail-layout {
    flex-direction: column;
    gap: 16px;
  }

  .tab-bar {
    margin-bottom: 16px;
  }

  .tab-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
}
</style>
