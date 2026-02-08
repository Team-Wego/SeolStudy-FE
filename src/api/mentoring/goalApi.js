import api from '@/api'

export function getGoals(menteeId) {
  return api.get('/goals', { params: { menteeId } })
}

export function createGoal(menteeId, name, subject) {
  const formData = new FormData()
  formData.append('request', new Blob([JSON.stringify({ name, subject, menteeId })], { type: 'application/json' }))
  return api.post('/goals', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
