<template>
  <div class="flex flex-col justify-center bg-white border border-[#E5E5EA] rounded-[28px]" style="padding: 16px 20px 24px;">
    <textarea
      v-model="model"
      :placeholder="placeholder"
      rows="2"
      class="w-full text-[14px] leading-[150%] text-[#3D3D3D] placeholder-[#C2C2C2] resize-none outline-none bg-transparent font-normal"
    />
  </div>
</template>

<script setup>
const model = defineModel({ type: String, default: '' })

defineProps({
  placeholder: {
    type: String,
    default: '오늘 공부하며 궁금했던 점이나 멘토님께 전하고 싶은 말을 남겨보세요.',
  },
})
</script>
