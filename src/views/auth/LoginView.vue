<template>
  <div class="login-page">
    <div class="login-container">
      <!-- 타이틀 영역 -->
      <div class="login-header">
        <h1 class="login-title">SeolStudy</h1>
        <p class="login-subtitle">멘토와 함께 그리는 가장 확실한 합격의 지도, 설스터디</p>
      </div>

      <!-- 폼 영역 -->
      <form class="login-form" @submit.prevent="handleLogin">
        <!-- 이메일 -->
        <div class="form-group">
          <label class="form-label" for="loginEmail">이메일</label>
          <div class="input-wrapper">
            <input id="loginEmail" v-model="form.email" type="text" class="form-input"
              :class="{ 'form-input--has-btn': form.email }" placeholder="이메일을 입력해주세요." autocomplete="email"
              :disabled="loading" @input="clearError" />
            <button v-if="form.email && !loading" type="button" class="input-btn" @click="form.email = ''; clearError()"
              tabindex="-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 비밀번호 -->
        <div class="form-group">
          <label class="form-label" for="loginPw">비밀번호</label>
          <div class="input-wrapper">
            <input id="loginPw" v-model="form.password" :type="showPassword ? 'text' : 'password'" class="form-input"
              :class="{ 'form-input--has-btn-double': form.password }" placeholder="비밀번호를 입력해주세요."
              autocomplete="current-password" :disabled="loading" @input="clearError" />
            <div v-if="form.password && !loading" class="input-btn-group">
              <!-- 눈 토글 -->
              <button type="button" class="input-btn" @click="showPassword = !showPassword" tabindex="-1">
                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
              <!-- X 삭제 -->
              <button type="button" class="input-btn" @click="form.password = ''; showPassword = false; clearError()"
                tabindex="-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 경고/에러 메시지 (항상 영역 확보) -->
        <div class="error-area">
          <span v-if="errorMsg" class="error-message">{{ errorMsg }}</span>
        </div>

        <!-- 로그인 버튼 -->
        <button type="submit" class="login-button" :class="{ 'login-button--disabled': !isFormValid && !loading }">
          <span v-if="loading" class="login-loading">
            <span class="spinner" />
            <span class="loading-text">로그인 중...</span>
          </span>
          <span v-else>로그인</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/api/auth/authApi'
import { setCookie } from '@/utils/cookie'
import { useChatStore } from '@/stores/chatStore'

const router = useRouter()
const chatStore = useChatStore()
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)

const form = reactive({
  email: '',
  password: '',
})

const isFormValid = computed(() => {
  return form.email.trim() !== '' && form.password.trim() !== ''
})

function clearError() {
  errorMsg.value = ''
}

async function handleLogin() {
  if (loading.value) return

  if (!form.email.trim() && !form.password.trim()) {
    errorMsg.value = '이메일과 비밀번호를 입력해주세요.'
    return
  }
  if (!form.email.trim()) {
    errorMsg.value = '이메일을 입력해주세요.'
    return
  }
  if (!form.password.trim()) {
    errorMsg.value = '비밀번호를 입력해주세요.'
    return
  }

  errorMsg.value = ''
  loading.value = true

  try {
    const { data } = await login(form.email, form.password)

    setCookie('memberId', data.id)
    setCookie('memberRole', data.role)
    setCookie('memberName', data.name)

    chatStore.loadCurrentUser()

    if (data.role === 'MENTOR') {
      router.push('/mentor/dashboard')
    } else {
      router.push('/mentee/home')
    }
  } catch (e) {
    errorMsg.value = e.response?.data?.message || '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── 페이지 전체 ── */
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  background: #ffffff;
  padding: 24px;
}

/* ── 로그인 컨테이너 ── */
.login-container {
  width: 100%;
  max-width: 400px;
}

/* ── 헤더 ── */
.login-header {
  text-align: center;
  margin-bottom: 48px;
}

.login-title {
  font-size: 32px;
  font-weight: 700;
  color: #111111;
  margin: 0 0 12px 0;
  letter-spacing: -0.5px;
}

.login-subtitle {
  font-size: 14px;
  color: #555555;
  margin: 0;
  line-height: 1.5;
}

/* ── 폼 ── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #111111;
}

/* ── Input wrapper ── */
.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  height: 52px;
  padding: 0 16px;
  border: none;
  border-radius: 12px;
  background: #f5f5f5;
  font-size: 14px;
  color: #111111;
  outline: none;
  transition: background 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-input--has-btn {
  padding-right: 44px;
}

.form-input--has-btn-double {
  padding-right: 72px;
}

.form-input::placeholder {
  color: #aaaaaa;
}

.form-input:focus {
  background: #f0f0f0;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.08);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Input 버튼 (X, 눈) ── */
.input-btn-group {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
}

.input-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bbbbbb;
  transition: color 0.2s;
  border-radius: 50%;
}

.input-btn:hover {
  color: #777777;
}

/* 이메일 X 버튼 (단일) */
.form-group>.input-wrapper>.input-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

/* ── 에러 메시지 영역 ── */
.error-area {
  min-height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -8px;
  margin-bottom: -8px;
}

.error-message {
  font-size: 13px;
  color: #e9412e;
  text-align: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* ── 로그인 버튼 ── */
.login-button {
  width: 100%;
  height: 56px;
  border: none;
  border-radius: 14px;
  background: #111111;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 4px;
}

.login-button:hover {
  background: #333333;
}

.login-button:active {
  background: #000000;
}

.login-button--disabled {
  background: #cccccc;
}

.login-button--disabled:hover {
  background: #bbbbbb;
}

/* ── 로딩 ── */
.login-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading-text {
  font-size: 15px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── 반응형: 모바일 (480px 이하) ── */
@media (max-width: 480px) {
  .login-page {
    padding: 30px;
  }

  .login-header {
    margin-bottom: 36px;
  }

  .login-title {
    font-size: 28px;
  }

  .login-subtitle {
    font-size: 13px;
  }

  .form-input {
    height: 48px;
    font-size: 14px;
  }

  .login-button {
    height: 52px;
    font-size: 15px;
  }
}

/* ── 반응형: 태블릿 이상 (768px 이상) ── */
@media (min-width: 768px) {
  .login-container {
    max-width: 440px;
  }

  .login-title {
    font-size: 36px;
  }

  .login-subtitle {
    font-size: 15px;
  }

  .form-input {
    height: 56px;
    font-size: 15px;
  }

  .login-button {
    height: 60px;
    font-size: 17px;
  }
}
</style>
