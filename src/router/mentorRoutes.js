import MentorLayout from '@/apps/mentor/layouts/MentorLayout.vue'

export default {
  path: '/mentor',
  component: MentorLayout,
  children: [
    {
      path: '',
      redirect: '/mentor/dashboard',
    },
    {
      path: 'dashboard',
      name: 'MentorDashboard',
      component: () => import('@/apps/mentor/views/DashboardView.vue'),
    },
    {
      path: 'mentees',
      name: 'MentorMenteeList',
      component: () => import('@/apps/mentor/views/MenteeListView.vue'),
    },
    {
      path: 'mentees/:menteeId',
      name: 'MentorMenteeDetail',
      component: () => import('@/apps/mentor/views/MenteeDetailView.vue'),
    },
  ],
}
