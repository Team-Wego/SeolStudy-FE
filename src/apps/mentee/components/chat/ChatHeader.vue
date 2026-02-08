<template>
  <div class="chat-header">
    <div class="header-left">
      <span class="mentor-name">{{ mentorName }}</span>
      <span v-if="isConnected" class="status-dot online" />
      <span v-else class="status-dot offline" />
    </div>
    <el-button :icon="FolderOpened" circle size="small" @click="$emit('openGallery')" />
  </div>
</template>

<script setup>
import { FolderOpened } from '@element-plus/icons-vue'

defineProps({
  mentorName: { type: String, default: '멘토' },
  isConnected: { type: Boolean, default: false },
})

defineEmits(['openGallery'])
</script>

<style scoped>
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mentor-name {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: #52c41a;
}

.status-dot.offline {
  background: #d9d9d9;
}
</style>
