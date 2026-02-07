import { createRouter, createWebHistory } from 'vue-router'
import menteeRoutes from './menteeRoutes'
import mentorRoutes from './mentorRoutes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    menteeRoutes,
    mentorRoutes,
    {
      path: '/',
      redirect: '/mentee',
    },
  ],
})

export default router
