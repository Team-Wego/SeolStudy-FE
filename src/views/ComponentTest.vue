<template>
  <div class="min-h-dvh bg-[#E4E4E4] p-8">
    <h1>컴포넌트</h1><br>

    <div class="flex gap-8 flex-wrap">
      <!-- 왼쪽 열 -->
      <div class="flex flex-col gap-6" style="width: 393px;">

        <!-- CTA -->
        <FigmaSection title="CTA">
          <CtaButton>공부 인증하기</CtaButton>
        </FigmaSection>

        <!-- 파일 -->
        <FigmaSection title="파일">
          <FileChip fileName="비문학 구조화 훈련.pdf" />
        </FigmaSection>

        <!-- 자료 -->
        <FigmaSection title="자료">
          <FileCard fileName="비문학 구조화 훈련.pdf" date="2025.01.29" fileSize="24.MB" />
        </FigmaSection>

      </div>

      <!-- 중간 열 - 태그들 -->
      <div class="flex gap-6">
        <!-- 과목 태그 small -->
        <FigmaSection title="과목 태그" dashed>
          <div class="flex flex-col gap-8">
            <SubjectTag subject="english" size="sm" />
            <SubjectTag subject="math" size="sm" />
            <SubjectTag subject="science" size="sm" />
          </div>
        </FigmaSection>

        <!-- 과목 태그 big -->
        <FigmaSection title="과목 태그 big" dashed>
          <div class="flex flex-col gap-8">
            <SubjectTag subject="english" size="md" />
            <SubjectTag subject="math" size="md" />
            <SubjectTag subject="science" size="md" />
          </div>
        </FigmaSection>

        <!-- 완료/미완료 -->
        <FigmaSection title="Frame 114" dashed>
          <div class="flex flex-col gap-8">
            <StatusBadge type="complete" size="md" />
            <StatusBadge type="incomplete" size="md" />
          </div>
        </FigmaSection>
      </div>

      <!-- 오른쪽 열 -->
      <div class="flex flex-col gap-6" style="width: 393px;">
        <!-- 플레이스 홀더 -->
        <FigmaSection title="플레이스 홀더" dashed>
          <div class="flex flex-col gap-4">
            <MessageInput v-model="emptyMsg" />
            <MessageInput v-model="filledMsg" />
          </div>
        </FigmaSection>

        <!-- 코멘트 남기기 -->
        <FigmaSection title="코멘트 남기기" dashed>
          <div class="flex flex-col gap-4 items-start">
            <CommentButton disabled />
            <CommentButton />
          </div>
        </FigmaSection>

        <!-- 하단 NAV -->
        <FigmaSection title="하단 NAV">
          <div class="bg-white rounded-xl overflow-hidden" style="padding: 20px 24px;">
            <div class="flex items-center justify-between" style="gap: 37px;">
              <div v-for="tab in navTabs" :key="tab.name" class="flex flex-col items-center gap-[2px]">
                <div class="flex items-center justify-center w-[38px] h-[40px]">
                  <component :is="tab.icon" :size="20" :color="tab.active ? '#0CA5FE' : '#A6A6A6'"
                    :stroke-width="1.8" />
                </div>
                <span class="text-[10px] leading-[12px] text-center"
                  :class="tab.name === 'mypage' ? 'w-[44px]' : 'w-[38px]'"
                  :style="{ color: tab.active ? '#0CA5FE' : '#A6A6A6' }">
                  {{ tab.label }}
                </span>
              </div>
            </div>
          </div>
        </FigmaSection>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineComponent, h } from 'vue'
import { Home, Calendar, MessageSquareText, MessagesSquare, User } from 'lucide-vue-next'
import StatusBadge from '@/components/common/StatusBadge.vue'
import SubjectTag from '@/components/common/SubjectTag.vue'
import CtaButton from '@/components/common/CtaButton.vue'
import CommentButton from '@/components/common/CommentButton.vue'
import FileChip from '@/components/common/FileChip.vue'
import FileCard from '@/components/common/FileCard.vue'
import MessageInput from '@/components/common/MessageInput.vue'

const emptyMsg = ref('')
const filledMsg = ref('공식은 외웠는데 문제에 적용하는 게 제일 어려운 것 같아요. 😂')

const navTabs = [
  { name: 'calendar', label: '캘린더', icon: Calendar, active: true },
  { name: 'feedback', label: '피드백', icon: MessageSquareText, active: false },
  { name: 'home', label: '홈', icon: Home, active: false },
  { name: 'chat', label: '채팅', icon: MessagesSquare, active: false },
  { name: 'mypage', label: '마이페이지', icon: User, active: false },
]

const FigmaSection = defineComponent({
  props: {
    title: String,
    dashed: Boolean,
  },
  setup(props, { slots }) {
    return () => h('div', {
      class: props.dashed
        ? 'border border-dashed border-[#8A38F5] rounded-[5px] px-8 py-6'
        : '',
    }, [
      h('p', { class: 'text-[#8A38F5] text-xs font-semibold mb-3' }, `❖ ${props.title}`),
      slots.default?.(),
    ])
  },
})
</script>
