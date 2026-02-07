<template>
  <button
    class="w-full flex items-center justify-center rounded-full bg-[#0CA5FE] text-white font-semibold text-[16px] leading-[19px] hover:bg-[#0B94E5] transition-colors disabled:opacity-50"
    style="padding: 24px 0;"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
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
