<template>
  <span class="inline-flex items-center justify-center w-fit self-start font-bold" :class="colorClass"
    :style="sizeStyle">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'incomplete',
    validator: (v) => ['complete', 'incomplete'].includes(v),
  },
  size: {
    type: String,
    default: 'sm',
    validator: (v) => ['sm', 'md'].includes(v),
  },
})

const labelMap = {
  complete: '완료',
  incomplete: '미완료',
}

const colorMap = {
  complete: 'bg-[#4AF38A] text-black',
  incomplete: 'bg-[#DBFDE8] text-[#8E8E93]',
}

const sizeStyles = {
  sm: { padding: '6px 10px', fontSize: '12px', lineHeight: '14px', borderRadius: '50px', letterSpacing: '-0.05em' },
  md: { padding: '10px 12px', fontSize: '12px', lineHeight: '12px', borderRadius: '50px', letterSpacing: '-0.05em' },
}

const label = computed(() => labelMap[props.type])
const colorClass = computed(() => colorMap[props.type])
const sizeStyle = computed(() => sizeStyles[props.size])
</script>
