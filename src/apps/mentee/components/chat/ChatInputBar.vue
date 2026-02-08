<template>
  <div class="input-area">
    <!-- 파일 프리뷰 -->
    <div v-if="pendingFile" class="file-preview">
      <div class="preview-info">
        <el-icon><Paperclip /></el-icon>
        <span class="preview-name">{{ pendingFile.fileName }}</span>
      </div>
      <el-button :icon="Close" circle size="small" @click="cancelFile" />
    </div>

    <!-- 입력바 -->
    <div class="input-bar">
      <el-button :icon="Paperclip" circle @click="triggerFileInput" />
      <input ref="fileInputRef" type="file" class="hidden-input" @change="handleFileSelect" />
      <el-input
        v-model="inputText"
        :placeholder="pendingFile ? '메시지를 함께 입력하거나 바로 전송하세요' : '메시지를 입력하세요'"
        @keydown.enter.exact.prevent="handleSend"
        size="large"
        class="msg-input"
      />
      <el-button
        type="primary"
        :icon="Promotion"
        circle
        :disabled="!canSend"
        :loading="isUploading"
        @click="handleSend"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Paperclip, Close, Promotion } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { uploadFile } from '@/api/chat/chatApi'

const emit = defineEmits(['send'])

const inputText = ref('')
const pendingFile = ref(null)
const fileInputRef = ref(null)
const isUploading = ref(false)

const canSend = computed(() => {
  return inputText.value.trim() !== '' || pendingFile.value !== null
})

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleFileSelect(e) {
  const file = e.target.files[0]
  if (!file) return

  // 50MB 제한
  if (file.size > 50 * 1024 * 1024) {
    ElMessage.warning('파일 크기는 50MB 이하만 가능합니다.')
    e.target.value = ''
    return
  }

  isUploading.value = true
  try {
    const { data } = await uploadFile(file)
    pendingFile.value = data
  } catch (err) {
    ElMessage.error('파일 업로드에 실패했습니다.')
    console.error(err)
  } finally {
    isUploading.value = false
    e.target.value = ''
  }
}

function cancelFile() {
  pendingFile.value = null
}

function handleSend() {
  if (!canSend.value) return

  if (pendingFile.value) {
    // 파일 메시지
    emit('send', {
      messageType: pendingFile.value.fileType,
      content: inputText.value.trim() || '',
      fileUrl: pendingFile.value.fileUrl,
      fileName: pendingFile.value.fileName,
    })
    pendingFile.value = null
  } else {
    // 텍스트 메시지
    emit('send', {
      messageType: 'TEXT',
      content: inputText.value.trim(),
      fileUrl: null,
      fileName: null,
    })
  }

  inputText.value = ''
}
</script>

<style scoped>
.input-area {
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.file-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #f5f7ff;
  border-bottom: 1px solid #e8ecff;
}

.preview-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4F6BFF;
}

.preview-name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
}

.msg-input {
  flex: 1;
}

.msg-input :deep(.el-input__wrapper) {
  border-radius: 20px;
}

.hidden-input {
  display: none;
}
</style>
