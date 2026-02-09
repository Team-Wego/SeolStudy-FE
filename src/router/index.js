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
    {
      path: '/test',
      name: 'ComponentTest',
      component: () => import('@/views/ComponentTest.vue'),
    },
    menteeRoutes,
    mentorRoutes,
    {
      path: '/',
      redirect: '/login',
    },
  ],
})

router.beforeEach((to, from) => {
  // 독립 페이지에서 나갈 때 slide-right 전환
  const slidePages = ['TaskCreate', 'GoalList', 'TaskDetail']
  if (slidePages.includes(from.name) && to.meta.transition !== 'slide-left') {
    from.meta.transition = 'slide-right'
    to.meta.transition = 'slide-right'
  }

  const memberId = getCookie('memberId')

  // 로그인 안 된 상태에서 로그인 외 페이지 접근 시
  if (!memberId && to.name !== 'Login' && to.name !== 'ComponentTest') {
    return { name: 'Login' }
  }

  // 로그인 된 상태에서 로그인 페이지 접근 시
  if (memberId && to.name === 'Login') {
    const role = getCookie('memberRole')
    return role === 'MENTOR' ? '/mentor/dashboard' : '/mentee/home'
  }
})

// 페이지 전환 시 body에 잔류하는 오버레이 정리
router.afterEach((to) => {
  if (to.name === 'Login') {
    // Element Plus el-dialog 오버레이 제거
    document.querySelectorAll('.el-overlay').forEach((el) => el.remove())
    // body에 남은 팝업 스타일 초기화
    document.body.style.overflow = ''
    document.body.classList.remove('el-popup-parent--hidden')
  }
})

export default router
