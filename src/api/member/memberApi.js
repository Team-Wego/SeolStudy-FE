import api from '@/api'

export function getMember(memberId) {
  return api.get(`/members/${memberId}`)
}
