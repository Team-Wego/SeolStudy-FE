import api from '@/api/index.js'

// 피드백 목록 조회
export const getFeedbacks = (menteeId, type) => {
  const params = { menteeId }
  if (type) params.type = type
  return api.get('/feedback', { params })
}

// 피드백 상세 조회
export const getFeedbackDetail = (feedbackId) => {
  return api.get(`/feedback/${feedbackId}`)
}

// 일별 피드백 카운트 조회
export const getDailyFeedbackCount = (menteeId, startDate, endDate) => {
  return api.get('/feedback/daily-count', {
    params: { menteeId, startDate, endDate },
  })
}

// 피드백 생성 (multipart/form-data: request part + optional files)
export const createFeedback = (data, files) => {
  const formData = new FormData()
  formData.append('request', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  if (files && files.length > 0) {
    files.forEach((file) => formData.append('files', file))
  }
  return api.post('/mentors/feedback', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
