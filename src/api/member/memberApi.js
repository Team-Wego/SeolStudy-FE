import api from '@/api'

export function getMember(memberId) {
  return api.get(`/members/${memberId}`)
}

export function getStudyStatus(menteeId, startDate, endDate) {
  return api.get(`/mentees/${menteeId}/study-status`, {
    params: { startDate, endDate },
  })
}
