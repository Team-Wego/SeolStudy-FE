import api from '@/api'

export const getMenteeList = () => {
  return api.get('/mentors/mentees')
}

export const getDashboardSummary = () => {
  return api.get('/mentors/dashboard/summary')
}

export const getPendingFeedbacks = () => {
  return api.get('/mentors/dashboard/pending-feedbacks')
}

export const getMenteeProgress = () => {
  return api.get('/mentors/dashboard/mentee-progress')
}
