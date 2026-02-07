import { createRouter, createWebHistory } from 'vue-router'
import menteeRoutes from './menteeRoutes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    menteeRoutes,
    {
      path: '/',
      redirect: '/mentee',
    },
  ],
})

export default router
