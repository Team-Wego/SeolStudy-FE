import api from '@/api'

export function getGoals(menteeId) {
  return api.get('/goals', { params: { menteeId } })
}
