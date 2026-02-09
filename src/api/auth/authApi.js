import api from '@/api'

export function login(email, password) {
  return api.post('/members/login', { email, password })
}
