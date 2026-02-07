<template>
  <div class="inline-flex items-center gap-5 bg-white rounded-full" style="padding: 12px 16px;">
    <span class="text-[12px] leading-[12px] font-semibold text-black truncate">{{ fileName }}</span>
    <button @click="$emit('download')" class="text-[#8E8E93] hover:text-[#636366] shrink-0">
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
})

defineEmits(['download'])
</script>
