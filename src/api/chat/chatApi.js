import api from '@/api/index.js'

// 멘토 채팅방 목록 조회
export const getMentorRooms = (mentorId) => {
  return api.get(`/chat/rooms/mentor/${mentorId}`)
}

// 멘티 채팅방 목록 조회
export const getMenteeRooms = (menteeId) => {
  return api.get(`/chat/rooms/mentee/${menteeId}`)
}

// 메시지 이력 조회 (페이징)
export const getMessages = (roomId, page = 0, size = 50) => {
  return api.get(`/chat/messages/${roomId}`, { params: { page, size } })
}

// 메시지 읽음 처리
export const markAsRead = (roomId, readerId) => {
  return api.post(`/chat/messages/${roomId}/read`, null, { params: { readerId } })
}

// 읽지 않은 메시지 수 조회
export const getUnreadCount = (roomId, userId) => {
  return api.get(`/chat/messages/${roomId}/unread`, { params: { userId } })
}

// 미디어/파일 목록 조회
export const getMediaFiles = (roomId, type) => {
  const params = type ? { type } : {}
  return api.get(`/chat/messages/${roomId}/media`, { params })
}

// 파일 업로드
export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/files/chat', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
