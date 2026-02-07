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
