<template>
  <div class="profile-edit-page">
    <!-- Header -->
    <div class="header">
      <button class="back-btn" @click="router.back()">
        <ChevronLeft :size="24" color="#1A1A1A" />
      </button>
      <h1 class="header-title">프로필 수정</h1>
      <div class="header-spacer" />
    </div>

    <!-- Skeleton Loading -->
    <template v-if="loading">
      <div class="avatar-section">
        <div class="skeleton skeleton-avatar-lg" />
        <div class="skeleton skeleton-text" style="width: 80px; height: 14px; margin-top: 12px;" />
      </div>
      <div class="form-section">
        <div v-for="i in 3" :key="i" class="form-group">
          <div class="skeleton skeleton-text" style="width: 60px; height: 14px; margin-bottom: 8px;" />
          <div class="skeleton" style="width: 100%; height: 48px; border-radius: 14px;" />
        </div>
      </div>
    </template>

    <!-- Actual Content -->
    <template v-else>
      <!-- Profile Image -->
      <div class="avatar-section">
        <div class="avatar-wrapper" @click="triggerFileInput">
          <img v-if="profilePreview" :src="profilePreview" alt="프로필" class="avatar-img-lg" />
          <div v-else class="avatar-placeholder-lg">
            <User :size="48" color="#A6A6A6" />
          </div>
          <div class="avatar-edit-badge">
            <Camera :size="14" color="#fff" />
          </div>
        </div>
        <button class="change-photo-btn" @click="triggerFileInput">사진 변경</button>
        <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileSelected" />
      </div>

      <!-- Form -->
      <div class="form-section">
        <div class="form-group">
          <label class="form-label">이름</label>
          <input v-model="form.name" type="text" class="form-input" placeholder="이름을 입력해 주세요." />
        </div>

        <div class="form-group">
          <label class="form-label">학년</label>
          <div class="select-wrapper">
            <select v-model="form.grade" class="form-select">
              <option value="" disabled>학년을 선택해 주세요.</option>
              <option v-for="g in gradeOptions" :key="g.value" :value="g.value">
                {{ g.label }}
              </option>
            </select>
            <ChevronDown :size="18" color="#A6A6A6" class="select-icon" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">목표 대학</label>
          <input v-model="form.goalUniversity" type="text" class="form-input" placeholder="목표 대학을 입력해 주세요." />
        </div>
      </div>
    </template>

    <!-- Save Button -->
    <div class="save-wrapper">
      <button class="save-btn" :disabled="saving" @click="handleSave">
        <span v-if="saving" class="saving-spinner" />
        {{ saving ? '저장 중...' : '저장하기' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, User, Camera, ChevronDown } from 'lucide-vue-next'
import { getCookie } from '@/utils/cookie'
import { getMember, updateMember } from '@/api/member/memberApi'

const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const fileInput = ref(null)
const profilePreview = ref(null)
const originalProfileUrl = ref(null)
const selectedFile = ref(null)

const form = ref({
  name: '',
  grade: '',
  goalUniversity: '',
})

const gradeOptions = [
  { value: 'HIGH_1', label: '고등학교 1학년' },
  { value: 'HIGH_2', label: '고등학교 2학년' },
  { value: 'HIGH_3', label: '고등학교 3학년' },
  { value: 'N_STUDENT', label: 'N수생' },
]

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileSelected(e) {
  const file = e.target.files[0]
  if (!file) return

  selectedFile.value = file

  // 미리보기 생성
  const reader = new FileReader()
  reader.onload = (ev) => {
    profilePreview.value = ev.target.result
  }
  reader.readAsDataURL(file)
}

async function handleSave() {
  try {
    saving.value = true

    const requestData = {
      profileUrl: originalProfileUrl.value,
      name: form.value.name,
      grade: form.value.grade || null,
      goalUniversity: form.value.goalUniversity || null,
      newProfileImage: !!selectedFile.value,
    }

    await updateMember(requestData, selectedFile.value || null)

    router.back()
  } catch (e) {
    console.error('Failed to update profile:', e)
    alert('프로필 수정에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

async function fetchMember() {
  try {
    loading.value = true
    const memberId = getCookie('memberId')
    if (!memberId) return

    const res = await getMember(memberId)
    const data = res.data

    form.value.name = data.name || ''
    form.value.grade = data.grade || ''
    form.value.goalUniversity = data.goalUniversity || ''
    originalProfileUrl.value = data.profileUrl || null
    profilePreview.value = data.profileUrl || null
  } catch (e) {
    console.error('Failed to fetch member:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMember()
})
</script>

<style scoped>
.profile-edit-page {
  padding: 16px 20px 120px;
  background: #F5F5F5;
  min-height: 100%;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
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

/* Avatar Section */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 36px;
}

.avatar-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  cursor: pointer;
}

.avatar-img-lg {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder-lg {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #E8E8E8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-edit-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 28px;
  height: 28px;
  background: #0CA5FE;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #F5F5F5;
}

.change-photo-btn {
  margin-top: 12px;
  background: none;
  border: none;
  color: #0CA5FE;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

/* Form Section */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 14px;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 14px 18px;
  background: #fff;
  border: 1.5px solid #E5E5EA;
  border-radius: 14px;
  font-size: 15px;
  color: #1A1A1A;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #0CA5FE;
}

.form-input::placeholder {
  color: #C2C2C2;
}

.select-wrapper {
  position: relative;
}

.form-select {
  width: 100%;
  padding: 14px 18px;
  padding-right: 40px;
  background: #fff;
  border: 1.5px solid #E5E5EA;
  border-radius: 14px;
  font-size: 15px;
  color: #1A1A1A;
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-select:focus {
  border-color: #0CA5FE;
}

.select-icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Save Button */
.save-wrapper {
  position: fixed;
  bottom: 94px;
  left: 0;
  right: 0;
  padding: 16px 20px 12px;
  z-index: 10;
}

.save-btn {
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.save-btn:hover {
  background: #0B94E5;
}

.save-btn:disabled {
  background: #A6A6A6;
  cursor: not-allowed;
}

.saving-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

.skeleton-avatar-lg {
  width: 100px;
  height: 100px;
  border-radius: 50%;
}

.skeleton-text {
  border-radius: 6px;
}
</style>
