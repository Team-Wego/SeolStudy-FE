<template>
  <button
    class="flex items-center justify-center rounded-full text-[14px] leading-[17px] font-semibold text-white transition-colors"
    :class="disabled ? 'bg-[#C5E4F8] cursor-not-allowed' : 'bg-[#0CA5FE] hover:bg-[#0B94E5]'"
    style="padding: 14px 16px;"
    :disabled="disabled"
    @click="$emit('click')"
  >
    코멘트 남기기
  </button>
</template>

<script setup>
defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])
</script>
