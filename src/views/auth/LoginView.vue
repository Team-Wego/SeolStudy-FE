<template>
  <div class="flex items-center justify-center h-dvh bg-gray-50">
    <el-card class="w-full max-w-sm" shadow="hover">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-900">SeolStudy</h1>
        <p class="text-sm text-gray-400 mt-2">학습 멘토링 플랫폼</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        @submit.prevent="handleLogin"
        label-position="top"
      >
        <el-form-item label="이메일" prop="email">
          <el-input
            v-model="form.email"
            placeholder="이메일을 입력하세요"
            size="large"
            :prefix-icon="Mail"
          />
        </el-form-item>

        <el-form-item label="비밀번호" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            size="large"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>

        <el-alert
          v-if="errorMsg"
          :title="errorMsg"
          type="error"
          show-icon
          :closable="false"
          class="mb-4"
        />

        <el-button
          type="primary"
          size="large"
          native-type="submit"
          :loading="loading"
          class="w-full"
        >
          로그인
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, Lock } from 'lucide-vue-next'
import { login } from '@/api/auth/authApi'
import { setCookie } from '@/utils/cookie'

const router = useRouter()
const formRef = ref(null)
const errorMsg = ref('')
const loading = ref(false)

const form = reactive({
  email: '',
  password: '',
})

const rules = {
  email: [{ required: true, message: '이메일을 입력해주세요', trigger: 'blur' }],
  password: [{ required: true, message: '비밀번호를 입력해주세요', trigger: 'blur' }],
}

async function handleLogin() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  errorMsg.value = ''
  loading.value = true

  try {
    const { data } = await login(form.email, form.password)

    setCookie('memberId', data.id)
    setCookie('memberRole', data.role)
    setCookie('memberName', data.name)

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
