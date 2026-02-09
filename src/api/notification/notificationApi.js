import api from '@/api/index.js'

// Firebase 웹 설정 조회
export const getFirebaseConfig = () => {
  return api.get('/notification/firebase-config')
}

// FCM 토큰 등록
export const registerFcmToken = (memberId, token) => {
  return api.post('/notification/token', { memberId, token })
}

// FCM 토큰 삭제 (로그아웃 시)
export const removeFcmToken = (memberId) => {
  return api.delete(`/notification/token/${memberId}`)
}

// 알림 목록 조회 (페이지네이션)
export const getNotifications = (memberId, page = 0) => {
  return api.get(`/notification/${memberId}`, { params: { page } })
}

// 읽지 않은 알림 수 조회
export const getUnreadNotificationCount = (memberId) => {
  return api.get(`/notification/${memberId}/unread-count`)
}

// 알림 읽음 처리
export const markNotificationAsRead = (notificationId) => {
  return api.patch(`/notification/${notificationId}/read`)
}

// 알림 삭제
export const deleteNotification = (notificationId) => {
  return api.delete(`/notification/${notificationId}`)
}
