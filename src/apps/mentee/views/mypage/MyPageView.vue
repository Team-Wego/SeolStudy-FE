<template>
  <div class="mypage">
    <!-- Header -->
    <h1 class="page-title">마이페이지</h1>

    <!-- Profile Section -->
    <div v-if="profileLoading" class="profile-section">
      <div class="skeleton skeleton-avatar" />
      <div class="profile-info">
        <div class="skeleton skeleton-text" style="width: 120px; height: 20px;" />
        <div class="skeleton skeleton-text" style="width: 80px; height: 14px;" />
      </div>
    </div>
    <div v-else class="profile-section">
      <div class="profile-avatar">
        <img v-if="member.profileUrl" :src="member.profileUrl" alt="프로필" class="avatar-img" />
        <div v-else class="avatar-placeholder">
          <User :size="32" color="#A6A6A6" />
        </div>
      </div>
      <div class="profile-info">
        <div class="profile-name-row">
          <span class="profile-name">{{ member.name || '이름' }}</span>
          <span class="profile-grade">{{ gradeLabel }}</span>
        </div>
        <button class="edit-photo-btn" @click="handleEditPhoto">
          사진 수정하기
          <ChevronRight :size="14" color="#A6A6A6" />
        </button>
      </div>
    </div>

    <!-- Study Report Section -->
    <div class="report-section">
      <div class="report-header">
        <h2 class="section-title">
          학습 리포트
          <img :src="mailbox" />
        </h2>
        <div class="tab-toggle">
          <button :class="['tab-btn', { active: viewMode === 'weekly' }]" @click="viewMode = 'weekly'">
            주간
          </button>
          <button :class="['tab-btn', { active: viewMode === 'monthly' }]" @click="viewMode = 'monthly'">
            월간
          </button>
        </div>
      </div>

      <!-- Skeleton Chart -->
      <div v-if="reportLoading" class="chart-card">
        <div class="skeleton skeleton-text" style="width: 80px; height: 36px; margin-bottom: 4px;" />
        <div class="skeleton skeleton-text" style="width: 120px; height: 14px; margin-bottom: 20px;" />
        <div v-if="viewMode === 'weekly'" class="bar-chart">
          <div v-for="i in 7" :key="i" class="bar-col">
            <div class="bar-track">
              <div class="skeleton" style="width: 100%; height: 40%; border-radius: 8px;" />
            </div>
            <div class="skeleton skeleton-text" style="width: 20px; height: 12px; margin-top: 8px;" />
          </div>
        </div>
        <div v-else style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 8px;">
            <div v-for="i in 7" :key="i" class="skeleton" style="flex: 1; aspect-ratio: 1.6/1; border-radius: 10px;" />
          </div>
          <div style="display: flex; gap: 8px;">
            <div v-for="i in 7" :key="i" class="skeleton" style="flex: 1; aspect-ratio: 1.6/1; border-radius: 10px;" />
          </div>
          <div style="display: flex; gap: 8px;">
            <div v-for="i in 7" :key="i" class="skeleton" style="flex: 1; aspect-ratio: 1.6/1; border-radius: 10px;" />
          </div>
        </div>
      </div>

      <!-- Weekly Chart -->
      <div v-else-if="viewMode === 'weekly'" class="chart-card">
        <div class="chart-rate">
          <span class="rate-number">{{ studyStatus.achievementRate ?? 0 }}</span>
          <span class="rate-percent">%</span>
        </div>
        <p class="rate-label">이번 주 과제 달성률</p>
        <div class="bar-chart">
          <div v-for="(day, idx) in weeklyData" :key="idx" class="bar-col">
            <div class="bar-track">
              <div class="bar-fill" :style="{ height: day.rate + '%' }" />
            </div>
            <span class="bar-label">{{ day.label }}</span>
          </div>
        </div>
      </div>

      <!-- Monthly Heatmap -->
      <div v-else class="chart-card">
        <div class="chart-rate">
          <span class="rate-number">{{ studyStatus.achievementRate ?? 0 }}</span>
          <span class="rate-percent">%</span>
        </div>
        <p class="rate-label">이번 달 과제 달성률</p>
        <div class="heatmap">
          <div class="heatmap-header">
            <span v-for="d in dayLabels" :key="d" class="heatmap-day-label">{{ d }}</span>
          </div>
          <div class="heatmap-grid">
            <template v-for="(cell, idx) in monthlyHeatmapData" :key="idx">
              <div :class="['heatmap-cell', cell.level]" />
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Subject Status Section -->
    <div class="subject-section">
      <h2 class="section-title">과목별 현황</h2>
      <div v-if="reportLoading" class="subject-list">
        <div v-for="i in 3" :key="i" class="subject-card">
          <div class="subject-card-left">
            <div class="skeleton skeleton-text" style="width: 50px; height: 18px;" />
            <div class="skeleton skeleton-text" style="width: 130px; height: 13px;" />
          </div>
          <div class="subject-card-right">
            <div class="skeleton" style="width: 52px; height: 30px; border-radius: 50px;" />
          </div>
        </div>
      </div>
      <div v-else class="subject-list">
        <div v-for="subject in subjectList" :key="subject.subject" class="subject-card clickable"
          @click="goToSubject(subject.subject)">
          <div class="subject-card-left">
            <span class="subject-name">{{ subjectNameMap[subject.subject] || subject.subject }}</span>
            <span class="subject-detail">
              필수 과제 {{ subject.completedTaskCount }}/{{ subject.totalTaskCount }} 완료
            </span>
          </div>
          <div class="subject-card-right">
            <span :class="['subject-badge', getBadgeColor(subject.achievementRate)]">
              {{ subject.achievementRate }}%
            </span>
            <ChevronRight :size="18" color="#C2C2C2" />
          </div>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="section-divider" />

    <!-- Library -->
    <div class="subject-section">
      <div class="subject-list">
        <div class="subject-card clickable" @click="router.push('/mentee/mypage/library')">
          <div class="subject-card-title">
            <div class="subject-card-title-header">
              <h2 class="section-title" style="margin: 0px;">
                자료실
                <img :src="folder" />
              </h2>
            </div>
            <span class="subject-detail">
              멘토가 업로드한 학습 자료를 한 곳에서 확인해요.
            </span>
          </div>
          <ChevronRight :size="20" color="#C2C2C2" />
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="section-divider" />

    <!-- Logout -->
    <button class="logout-text-btn" @click="showLogoutModal = true">
      <div class="logout-text-left">
        <LogOut :size="18" color="#E9412E" />
        <span>로그아웃</span>
      </div>
      <!-- <ChevronRight :size="16" color="#C2C2C2" /> -->
    </button>

    <!-- Logout Modal -->
    <Teleport to="body">
      <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
        <div class="modal-card">
          <p class="modal-title">로그아웃 하시겠습니까?</p>
          <p class="modal-desc">다시 로그인해야 이용할 수 있어요.</p>
          <div class="modal-actions">
            <button class="modal-cancel" @click="showLogoutModal = false">취소</button>
            <button class="modal-confirm" @click="handleLogout">로그아웃</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Consultation Button (Fixed) -->
    <button class="consult-btn" @click="openConsultForm">
      <Headphones :size="18" />
      <span>상담 받아보기</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight, User, Headphones, LogOut } from 'lucide-vue-next'
import { removeCookie, getCookie } from '@/utils/cookie'
import { getMember, getStudyStatus } from '@/api/member/memberApi'
import { getTaskDailyStatus } from '@/api/task/taskApi'
import mailbox from '@/assets/icons/mailbox.svg'
import folder from '@/assets/icons/folder.svg'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  eachDayOfInterval,
  getDay,
} from 'date-fns'

const router = useRouter()
const viewMode = ref('weekly')
const member = ref({})
const studyStatus = ref({})
const weeklyTaskMap = ref({})
const monthlyTaskMap = ref({})
const showLogoutModal = ref(false)
const profileLoading = ref(true)
const reportLoading = ref(true)

const dayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const subjectNameMap = {
  KOR: '국어',
  ENG: '영어',
  MATH: '수학',
  ETC: '기타',
}

const gradeLabel = computed(() => {
  const g = member.value.grade;

  if (!g) return '';

  const gradeMap = {
    HIGH_1: '고등학교 1학년',
    HIGH_2: '고등학교 2학년',
    HIGH_3: '고등학교 3학년',
    N_STUDENT: 'N수생'
  };

  return gradeMap[g] || g;
});

const requiredSubjects = ['KOR', 'ENG', 'MATH']

const subjectList = computed(() => {
  const apiSubjects = studyStatus.value.subjects || []

  // 필수 과목(국어, 영어, 수학)을 기본값으로 세팅
  const merged = requiredSubjects.map((subjectKey) => {
    const found = apiSubjects.find((s) => s.subject === subjectKey)
    return found || {
      subject: subjectKey,
      totalTaskCount: 0,
      completedTaskCount: 0,
      achievementRate: 0,
    }
  })

  // API에서 온 나머지 과목(ETC 등) 추가
  apiSubjects.forEach((s) => {
    if (!requiredSubjects.includes(s.subject)) {
      merged.push(s)
    }
  })

  return merged
})

// Weekly bar chart data
const weeklyData = computed(() => {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  return days.map((day) => {
    const key = format(day, 'yyyy-MM-dd')
    const data = weeklyTaskMap.value[key]
    const rate = data ? Math.round((data.completed / data.total) * 100) : 0
    const dayIndex = getDay(day)
    const labels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    return {
      label: labels[dayIndex],
      rate: data ? rate : 0,
    }
  })
})

// Monthly heatmap data
const monthlyHeatmapData = computed(() => {
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Find what day of week the month starts on (0=Sun, 1=Mon, ...)
  const firstDayOfWeek = getDay(monthStart)
  // Convert to Monday-based (0=Mon, 1=Tue, ..., 6=Sun)
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  const cells = []

  // Add empty cells for offset
  for (let i = 0; i < offset; i++) {
    cells.push({ level: 'empty' })
  }

  days.forEach((day) => {
    const key = format(day, 'yyyy-MM-dd')
    const data = monthlyTaskMap.value[key]
    if (!data || data.total === 0) {
      cells.push({ level: 'none' })
    } else {
      const rate = Math.round((data.completed / data.total) * 100)
      if (rate === 100) cells.push({ level: 'level-4' })
      else if (rate >= 70) cells.push({ level: 'level-3' })
      else if (rate >= 40) cells.push({ level: 'level-2' })
      else if (rate > 0) cells.push({ level: 'level-1' })
      else cells.push({ level: 'none' })
    }
  })

  return cells
})

function getBadgeColor(rate) {
  if (rate >= 80) return 'badge-green'
  if (rate >= 40) return 'badge-gray'
  return 'badge-red'
}

function handleEditPhoto() {
  // TODO: 사진 수정 기능
}

function openConsultForm() {
  window.open('https://forms.gle/FchKdDcm23JdGHpK9', '_blank')
}

function goToSubject(subjectKey) {
  const today = new Date()
  let startDate, endDate

  if (viewMode.value === 'weekly') {
    startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    endDate = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  } else {
    startDate = format(startOfMonth(today), 'yyyy-MM-dd')
    endDate = format(endOfMonth(today), 'yyyy-MM-dd')
  }

  router.push({
    path: `/mentee/mypage/subject/${subjectKey}`,
    query: { startDate, endDate, mode: viewMode.value },
  })
}

function handleLogout() {
  showLogoutModal.value = false
  removeCookie('memberId')
  removeCookie('memberRole')
  removeCookie('memberName')
  router.push('/login')
}

async function fetchMember() {
  try {
    profileLoading.value = true
    const memberId = getCookie('memberId')
    if (!memberId) return
    const res = await getMember(memberId)
    member.value = res.data
  } catch (e) {
    console.error('Failed to fetch member:', e)
  } finally {
    profileLoading.value = false
  }
}

async function fetchStudyStatus() {
  try {
    reportLoading.value = true
    const memberId = getCookie('memberId');

    if (!memberId) return;

    const today = new Date();

    let startDate, endDate;

    if (viewMode.value === 'weekly') {
      startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

      endDate = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    } else {
      startDate = format(startOfMonth(today), 'yyyy-MM-dd');

      endDate = format(endOfMonth(today), 'yyyy-MM-dd');
    }

    const res = await getStudyStatus(memberId, startDate, endDate);

    studyStatus.value = res.data;
  } catch (e) {
    console.error('Failed to fetch study status:', e);
  } finally {
    reportLoading.value = false
  }
}

async function fetchWeeklyTaskMap() {
  try {
    const memberId = getCookie('memberId');

    if (!memberId) return;

    const today = new Date();

    const startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const endDate = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    // const res = await getTaskDailyStatus(memberId, startDate, endDate, 'ASSIGNMENT');
    const res = await getTaskDailyStatus(memberId, startDate, endDate);

    const map = {};

    res.data.forEach((item) => {
      map[item.date] = { total: item.totalTaskCount, completed: item.completedTaskCount }
    });

    weeklyTaskMap.value = map;
  } catch (e) {
    console.error('Failed to fetch weekly tasks:', e);
  }
}

async function fetchMonthlyTaskMap() {
  try {
    const memberId = getCookie('memberId');
    if (!memberId) return;

    const today = new Date();
    const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(today), 'yyyy-MM-dd');

    // const res = await getTaskDailyStatus(memberId, startDate, endDate, 'ASSIGNMENT');
    const res = await getTaskDailyStatus(memberId, startDate, endDate);

    const map = {};
    res.data.forEach((item) => {
      map[item.date] = { total: item.totalTaskCount, completed: item.completedTaskCount };
    });
    monthlyTaskMap.value = map;
  } catch (e) {
    console.error('Failed to fetch monthly tasks:', e);
  }
}

watch(viewMode, () => {
  fetchStudyStatus();
  if (viewMode.value === 'weekly') {
    fetchWeeklyTaskMap();
  } else {
    fetchMonthlyTaskMap();
  }
})

onMounted(() => {
  fetchMember();
  fetchStudyStatus();
  fetchWeeklyTaskMap();
})
</script>

<style scoped>
.mypage {
  padding: 16px 20px 100px;
  background: #F5F5F5;
  min-height: 100vh;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 20px;
  color: #1A1A1A;
}

/* Profile */
.profile-section {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  background: #E8E8E8;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-name-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.profile-name {
  font-size: 18px;
  font-weight: 700;
  color: #1A1A1A;
}

.profile-grade {
  font-size: 14px;
  color: #8E8E93;
}

.edit-photo-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: #A6A6A6;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

/* Report Section */
.report-section {
  margin-bottom: 28px;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1A1A1A;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-title img {
  width: 20px;
}

.tab-toggle {
  display: flex;
  padding: 3px;
  background: #EBEBEB;
  border-radius: 21px;
}

.tab-btn {
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  background: transparent;
  color: #8E8E93;
  border-radius: 30px;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #fff;
  color: #333;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Chart Card */
.chart-card {
  background: #fff;
  border-radius: 28px;
  padding: 24px 22px;
}

.chart-rate {
  display: flex;
  align-items: baseline;
}

.rate-number {
  font-size: 36px;
  font-weight: 700;
  color: #8E8E93;
}

.rate-percent {
  font-size: 16px;
  font-weight: 700;
  color: #8E8E93;
  margin-left: 2px;
}

.rate-label {
  font-size: 12px;
  color: #8E8E93;
  margin-bottom: 20px;
}

/* Bar Chart */
.bar-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 8px;
  height: 100px;
}

.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
}

.bar-track {
  flex: 1;
  width: 100%;
  max-width: 36px;
  background: #F0F0F0;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: #4AF38A;
  border-radius: 8px;
  min-height: 4px;
  transition: height 0.4s ease;
}

.bar-label {
  font-size: 12px;
  color: black;
  font-weight: 700;
  margin-top: 8px;
}

/* Heatmap */
.heatmap {
  margin-top: 4px;
}

.heatmap-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.heatmap-day-label {
  text-align: center;
  font-size: 13px;
  color: #8E8E93;
  font-weight: 500;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.heatmap-cell {
  aspect-ratio: 1.6 / 1;
  border-radius: 10px;
  transition: background-color 0.3s;
}

.heatmap-cell.empty {
  background: transparent;
}

.heatmap-cell.none {
  background: #E8E8E8;
}

.heatmap-cell.level-1 {
  background: #DBFDE8;
}

.heatmap-cell.level-2 {
  background: #A0F0C0;
}

.heatmap-cell.level-3 {
  background: #5CE892;
}

.heatmap-cell.level-4 {
  background: #4AF38A;
}

/* Subject Section */
.subject-section {
  margin-bottom: 24px;
}

.subject-section .section-title {
  margin-bottom: 14px;
}

.subject-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.subject-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 28px;
  padding: 20px 24px;
}

.subject-card.clickable {
  cursor: pointer;
  transition: background-color 0.15s;
}

.subject-card.clickable:active {
  background: #F5F5F5;
}

.subject-card-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.subject-card-title-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.subject-card-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.subject-name {
  font-size: 18px;
  font-weight: 700;
  color: #1A1A1A;
}

.subject-detail {
  font-size: 13px;
  color: #A6A6A6;
}

.subject-card-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subject-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 700;
}

.badge-green {
  background: #DBFDE8;
  color: #1A1A1A;
}

.badge-gray {
  background: #F0F0F0;
  color: #3D3D3D;
}

.badge-red {
  background: #FDECEA;
  color: #E9412E;
}

/* Consultation Button (Fixed) */
.consult-btn {
  position: fixed;
  bottom: 110px;
  right: 20px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  background: #0CA5FE;
  color: #fff;
  border: none;
  border-radius: 22.5px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(12, 165, 254, 0.3);
  transition: background-color 0.2s, transform 0.2s;
}

.consult-btn:hover {
  background: #0B94E5;
  transform: scale(1.03);
}

/* Section Divider */
.section-divider {
  height: 1px;
  background: #E5E5EA;
  margin: 0 4px 24px;
}

/* Logout Button */
.logout-text-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 4px;
  background: none;
  border: none;
  cursor: pointer;
  margin-bottom: 24px;
}

.logout-text-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #E9412E;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-card {
  background: #fff;
  border-radius: 20px;
  padding: 28px 24px 20px;
  width: 280px;
  text-align: center;
}

.modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 8px;
}

.modal-desc {
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.modal-cancel {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: #F3F4F6;
  color: #3D3D3D;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.modal-confirm {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: #E9412E;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

/* Skeleton Loading */
.skeleton {
  background: #E8E8E8;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%);
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-text {
  border-radius: 6px;
}
</style>
