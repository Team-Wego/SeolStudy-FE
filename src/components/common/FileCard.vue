<template>
  <div class="flex items-center justify-between bg-white rounded-[24px]" style="padding: 20px 24px;">
    <div class="flex flex-col gap-2 min-w-0">
      <span class="text-[14px] leading-[14px] font-semibold text-black truncate">{{ fileName }}</span>
      <div class="flex items-center gap-[2px] text-[10px] leading-[10px] text-[#8E8E93]">
        <span>{{ date }}</span>
        <span class="w-[1px] h-[1px] bg-[#8E8E93] rounded-full mx-[2px]"></span>
        <span>{{ fileSize }}</span>
      </div>
    </div>
    <button
      @click="$emit('download')"
      class="shrink-0 w-[42px] h-[42px] flex items-center justify-center bg-[#F3F4F6] rounded-full text-[#8E8E93] hover:bg-gray-200 transition-colors"
    >
      <FileDown :size="17" />
    </button>
  </div>
</template>

<script setup>
import { FileDown } from 'lucide-vue-next'

defineProps({
  fileName: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    default: '',
  },
  fileSize: {
    type: String,
    default: '',
  },
})

defineEmits(['download'])
</script>
