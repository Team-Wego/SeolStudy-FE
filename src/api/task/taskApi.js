import api from '@/api'

export function createTask(menteeId, data) {
  return api.post(`/mentees/${menteeId}/tasks`, data)
}

export function getDailyTasks(menteeId, date) {
  return api.get(`/mentees/${menteeId}/planner/tasks`, { params: { date } })
}
