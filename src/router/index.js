import { createRouter, createWebHistory } from 'vue-router'
import { getCookie } from '@/utils/cookie'
import menteeRoutes from './menteeRoutes'
import mentorRoutes from './mentorRoutes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/LoginView.vue'),
    },
    menteeRoutes,
    mentorRoutes,
    {
      path: '/',
      redirect: '/login',
    },
  ],
})

router.beforeEach((to) => {
  const memberId = getCookie('memberId')

  // 로그인 안 된 상태에서 로그인 외 페이지 접근 시
  if (!memberId && to.name !== 'Login') {
    return { name: 'Login' }
  }

  // 로그인 된 상태에서 로그인 페이지 접근 시
  if (memberId && to.name === 'Login') {
    const role = getCookie('memberRole')
    return role === 'MENTOR' ? '/mentor/dashboard' : '/mentee/home'
  }
})

export default router
