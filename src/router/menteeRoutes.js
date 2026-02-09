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
      path: 'feedback/:id',
      name: 'MenteeFeedbackDetail',
      component: () => import('@/apps/mentee/views/feedback/FeedbackDetailView.vue'),
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
    {
      path: 'mypage/profile',
      name: 'MenteeProfileEdit',
      component: () => import('@/apps/mentee/views/mypage/ProfileEditView.vue'),
    },
    {
      path: 'mypage/library',
      name: 'MenteeLibrary',
      component: () => import('@/apps/mentee/views/mypage/library/LibraryView.vue'),
    },
    {
      path: 'mypage/subject/:subject',
      name: 'MenteeSubjectDetail',
      component: () => import('@/apps/mentee/views/subject/SubjectDetailView.vue'),
    },
    {
      path: 'tasks/create',
      name: 'TaskCreate',
      component: () => import('@/apps/mentee/views/home/TaskCreateView.vue'),
      meta: { transition: 'slide-left' },
    },
    {
      path: 'tasks/:id',
      name: 'TaskDetail',
      component: () => import('@/apps/mentee/views/home/TaskDetailView.vue'),
      meta: { transition: 'slide-left' },
    },
    {
      path: 'goals',
      name: 'GoalList',
      component: () => import('@/apps/mentee/views/home/GoalListView.vue'),
      meta: { transition: 'slide-left' },
    },
  ],
}
