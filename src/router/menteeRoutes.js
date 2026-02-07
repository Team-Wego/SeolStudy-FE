import MenteeLayout from '@/apps/mentee/layouts/MenteeLayout.vue'

export default {
  path: '/mentee',
  component: MenteeLayout,
  children: [
    {
      path: '',
      redirect: '/mentee/home',
    },
    {
      path: 'home',
      name: 'MenteeHome',
      component: () => import('@/apps/mentee/views/home/HomeView.vue'),
    },
    {
      path: 'calendar',
      name: 'MenteeCalendar',
      component: () => import('@/apps/mentee/views/calendar/CalendarView.vue'),
    },
    {
      path: 'feedback',
      name: 'MenteeFeedback',
      component: () => import('@/apps/mentee/views/feedback/FeedbackView.vue'),
    },
    {
      path: 'chat',
      name: 'MenteeChat',
      component: () => import('@/apps/mentee/views/chat/ChatListView.vue'),
    },
    {
      path: 'mypage',
      name: 'MenteeMyPage',
      component: () => import('@/apps/mentee/views/mypage/MyPageView.vue'),
    },
  ],
}
