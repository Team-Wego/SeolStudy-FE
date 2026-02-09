<template>
  <div class="mentee-list-page">
    <!-- 검색창 -->
    <div class="search-wrapper">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="멘티 이름을 입력해주세요.."
      />
      <Search class="search-icon" :size="20" />
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading-text">불러오는 중...</div>

    <!-- 빈 상태 -->
    <div v-else-if="filteredMentees.length === 0 && !loading" class="empty-text">
      {{ searchQuery ? '검색 결과가 없습니다' : '담당 멘티가 없습니다' }}
    </div>

    <!-- 멘티 카드 그리드 -->
    <div v-else class="mentee-grid">
      <div
        v-for="mentee in filteredMentees"
        :key="mentee.menteeId"
        class="mentee-card"
        @click="goToDetail(mentee.menteeId)"
      >
        <!-- 상단: 프로필 영역 -->
        <div class="card-top">
          <img
            v-if="mentee.profileUrl"
            :src="mentee.profileUrl"
            class="profile-img"
            alt="프로필"
          />
          <div v-else class="profile-placeholder">
            <User :size="32" color="#999" />
          </div>
          <div class="profile-info">
            <span class="mentee-name">{{ mentee.name }}</span>
            <span class="mentee-grade">{{ formatGrade(mentee.grade) }}</span>
          </div>
        </div>

        <!-- 하단: 상세 정보 -->
        <div class="card-bottom">
          <div class="info-row">
            <span class="info-label">담당 기간</span>
            <span class="info-value">{{ formatPeriod(mentee.startedAt, mentee.endedAt) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">목표 대학교</span>
            <span class="info-value">{{ mentee.goalUniversity || '-' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, User } from 'lucide-vue-next'
import { getMenteeList } from '@/api/mentoring/mentoringApi'

const router = useRouter()
const loading = ref(false)
const searchQuery = ref('')
const mentees = ref([])

const gradeMap = {
  HIGH_1: '고등학교 1학년',
  HIGH_2: '고등학교 2학년',
  HIGH_3: '고등학교 3학년',
  N_STUDENT: 'N수생',
}

function formatGrade(grade) {
  return gradeMap[grade] || grade || '-'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`
}

function formatPeriod(start, end) {
  const s = formatDate(start)
  const e = formatDate(end)
  if (!s && !e) return '-'
  return `${s} ~ ${e}`
}

const filteredMentees = computed(() => {
  if (!searchQuery.value.trim()) return mentees.value
  const q = searchQuery.value.trim().toLowerCase()
  return mentees.value.filter((m) => m.name.toLowerCase().includes(q))
})

function goToDetail(menteeId) {
  router.push(`/mentor/mentees/${menteeId}`)
}

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await getMenteeList()
    mentees.value = data
  } catch (err) {
    console.error('멘티 목록 로드 실패:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.mentee-list-page {
  padding: 32px 40px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 검색창 */
.search-wrapper {
  position: relative;
  margin-bottom: 32px;
}

.search-input {
  width: 100%;
  padding: 16px 50px 16px 20px;
  border: 1px solid #e0e0e0;
  border-radius: 14px;
  font-size: 15px;
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
}

.search-input:focus {
  border-color: #5bb8f6;
}

.search-input::placeholder {
  color: #bbb;
}

.search-icon {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

/* 그리드 */
.mentee-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 1024px) {
  .mentee-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .mentee-list-page {
    padding: 20px 16px;
  }

  .mentee-grid {
    grid-template-columns: 1fr;
  }
}

/* 카드 */
.mentee-card {
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.mentee-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* 카드 상단 */
.card-top {
  padding: 28px 24px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mentee-name {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
}

.mentee-grade {
  font-size: 13px;
  font-weight: 600;
  color: #3aafe0;
}

/* 카드 하단 */
.card-bottom {
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.info-row {
  display: flex;
  gap: 12px;
  align-items: baseline;
}

.info-label {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  min-width: 60px;
}

.info-value {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

/* 상태 텍스트 */
.loading-text,
.empty-text {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 80px 0;
}
</style>
