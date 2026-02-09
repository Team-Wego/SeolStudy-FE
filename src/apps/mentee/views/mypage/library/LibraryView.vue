<template>
  <div class="library-page">
    <!-- Header -->
    <div class="header">
      <button class="back-btn" @click="router.back()">
        <ChevronLeft :size="24" color="#1A1A1A" />
      </button>
      <h1 class="header-title">멘토 자료실</h1>
      <div class="header-spacer" />
    </div>

    <!-- Search Bar -->
    <div class="search-bar">
      <input v-model="searchInput" type="text" placeholder="찾으시는 학습 자료의 제목을 입력해 주세요." class="search-input"
        @keyup.enter="applySearch" />
      <button class="search-icon-btn" @click="applySearch">
        <Search :size="20" color="#A6A6A6" />
      </button>
    </div>

    <!-- Subject Filter -->
    <div class="filter-row">
      <button v-for="filter in subjectFilters" :key="filter.value"
        :class="['filter-chip', { active: selectedSubject === filter.value }]" @click="selectSubject(filter.value)">
        {{ filter.label }}
      </button>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="loading" class="file-list">
      <div v-for="i in 4" :key="i" class="file-row">
        <div class="skeleton" style="width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;" />
        <div class="file-card">
          <div class="file-info">
            <div class="skeleton skeleton-text" style="width: 160px; height: 14px;" />
            <div class="skeleton skeleton-text" style="width: 100px; height: 10px;" />
          </div>
          <div class="skeleton" style="width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;" />
        </div>
      </div>
    </div>

    <!-- File List -->
    <div v-else class="file-list">
      <div v-for="file in fileList" :key="file.worksheetId" class="file-row">
        <button class="file-checkbox" :class="{ checked: selectedFiles.includes(file.worksheetId) }"
          @click="toggleFile(file.worksheetId)">
          <Check v-if="selectedFiles.includes(file.worksheetId)" :size="14" color="#fff" />
        </button>
        <div class="file-card">
          <div class="file-info">
            <span class="file-name">{{ file.worksheetName }}</span>
            <span class="file-meta">
              <template v-if="file.goalName">{{ file.goalName }} · </template>
              {{ formatSize(file.size) }}
            </span>
          </div>
          <button class="file-download-icon" @click="downloadFile(file.url, file.worksheetName)">
            <img :src="downloadIcon" alt="download" class="download-icon" />
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="fileList.length === 0" class="empty-state">
        <p>학습 자료가 없습니다.</p>
      </div>
    </div>

    <!-- Download CTA Button -->
    <div v-if="selectedFiles.length > 0" class="cta-wrapper">
      <button class="cta-btn" @click="downloadSelected">
        다운받기
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft, Search, Download, Check } from 'lucide-vue-next'
import { getCookie } from '@/utils/cookie'
import { getWorksheetFiles } from '@/api/task/taskApi'
import downloadIcon from '@/assets/icons/download.svg'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const searchInput = ref('')
const selectedSubject = ref('ALL')
const selectedFiles = ref([])
const fileList = ref([])

const subjectFilters = [
  { label: '전체', value: 'ALL' },
  { label: '영어', value: 'ENG' },
  { label: '수학', value: 'MATH' },
  { label: '국어', value: 'KOR' },
]

// URL 쿼리에서 초기값 세팅
function initFromQuery() {
  const q = route.query
  if (q.keyword) searchInput.value = q.keyword
  if (q.subject) selectedSubject.value = q.subject
}

// URL 쿼리 업데이트
function updateQuery() {
  const query = {}
  if (searchInput.value.trim()) query.keyword = searchInput.value.trim()
  if (selectedSubject.value !== 'ALL') query.subject = selectedSubject.value
  router.replace({ query })
}

// 검색 실행
function applySearch() {
  updateQuery()
  fetchFiles()
}

// 과목 필터 선택
function selectSubject(value) {
  selectedSubject.value = value
  updateQuery()
  fetchFiles()
}

function toggleFile(id) {
  const idx = selectedFiles.value.indexOf(id)
  if (idx > -1) {
    selectedFiles.value.splice(idx, 1)
  } else {
    selectedFiles.value.push(id)
  }
}

function formatSize(bytes) {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)}MB`
  const kb = bytes / 1024
  return `${kb.toFixed(0)}KB`
}

function downloadFile(url, name) {
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = name || 'file'
  a.target = '_blank'
  a.click()
}

function downloadSelected() {
  const selected = fileList.value.filter((f) => selectedFiles.value.includes(f.worksheetId))
  selected.forEach((file) => {
    downloadFile(file.url, file.worksheetName)
  })
}

async function fetchFiles() {
  try {
    loading.value = true
    const memberId = getCookie('memberId')
    if (!memberId) return

    const keyword = searchInput.value.trim() || undefined
    const subject = selectedSubject.value !== 'ALL' ? selectedSubject.value : undefined

    const res = await getWorksheetFiles(memberId, keyword, subject)
    fileList.value = res.data
  } catch (e) {
    console.error('Failed to fetch worksheet files:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initFromQuery()
  fetchFiles()
})
</script>

<style scoped>
.library-page {
  padding: 16px 20px 40px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: #1A1A1A;
}

.header-spacer {
  width: 24px;
}

/* Search Bar */
.search-bar {
  display: flex;
  align-items: center;
  background: #F3F4F6;
  border-radius: 16px;
  padding: 14px 18px;
  margin-bottom: 16px;
  gap: 10px;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: #1A1A1A;
}

.search-input::placeholder {
  color: #A6A6A6;
}

.search-icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

/* Filter Chips */
.filter-row {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.filter-chip {
  padding: 8px 16px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 600;
  /* border: 1.5px solid #E5E5EA; */
  background: #E2E4E6;
  color: #8A9093;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip.active {
  background: #0CA5FE;
  color: #fff;
  border-color: #0CA5FE;
}

/* File List */
.file-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-checkbox {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid #E5E5EA;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}

.file-checkbox.checked {
  background: #0CA5FE;
  border-color: #0CA5FE;
}

.file-card {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #E5E5EA;
  border-radius: 20px;
  padding: 20px 24px;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 700;
  color: #1A1A1A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 10px;
  color: #A6A6A6;
}

.file-download-icon {
  width: 42px;
  height: 42px;
  background: #F3F4F6;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.download-icon {
  width: 16px;
  height: 20px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #A6A6A6;
  font-size: 14px;
}

/* CTA Download Button */
.cta-wrapper {
  position: fixed;
  bottom: 94px;
  left: 0;
  right: 0;
  padding: 16px 20px 12px;
  z-index: 10;
}

.cta-btn {
  width: 100%;
  padding: 16px;
  background: #0CA5FE;
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cta-btn:hover {
  background: #0B94E5;
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

.skeleton-text {
  border-radius: 6px;
}
</style>
