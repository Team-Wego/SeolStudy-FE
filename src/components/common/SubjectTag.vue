<template>
  <span
    class="inline-flex items-center justify-center w-fit self-start"
    :class="[fontClass, colorClass]"
    :style="sizeStyle"
  >
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  subject: {
    type: String,
    required: true,
    validator: (v) => ['english', 'math', 'science'].includes(v),
  },
  size: {
    type: String,
    default: 'sm',
    validator: (v) => ['sm', 'md'].includes(v),
  },
})

const config = {
  english: { label: '영어', bg: 'bg-[#E6F9F1]', text: 'text-[#14CB7F]' },
  math:    { label: '수학', bg: 'bg-[#F1EEFF]', text: 'text-[#7458FF]' },
  science: { label: '과학', bg: 'bg-[#FDECEA]', text: 'text-[#E9412E]' },
}

const sizeStyles = {
  sm: { padding: '4px 6px', fontSize: '10px', lineHeight: '10px', borderRadius: '4px' },
  md: { padding: '10px 12px', fontSize: '12px', lineHeight: '12px', borderRadius: '30px' },
}

const fontMap = {
  sm: 'font-medium',
  md: 'font-semibold',
}

const label = computed(() => config[props.subject].label)
const colorClass = computed(() => `${config[props.subject].bg} ${config[props.subject].text}`)
const fontClass = computed(() => fontMap[props.size])
const sizeStyle = computed(() => sizeStyles[props.size])
</script>
