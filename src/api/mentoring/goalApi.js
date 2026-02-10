import api from '@/api'

export function getGoals(menteeId) {
  return api.get('/goals', { params: { menteeId } })
}

export function createGoal(menteeId, name, subject, file) {
  const formData = new FormData()
  formData.append('request', new Blob([JSON.stringify({ name, subject, menteeId })], { type: 'application/json' }))
  if (file) formData.append('file', file)
  return api.post('/goals', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function updateGoal(goalId, name, subject) {
  const formData = new FormData()
  formData.append('request', new Blob([JSON.stringify({ name, subject, worksheetChanged: false })], { type: 'application/json' }))
  return api.put(`/goals/${goalId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function deleteGoal(goalId) {
  return api.delete(`/goals/${goalId}`)
}
