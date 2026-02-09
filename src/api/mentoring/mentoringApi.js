import api from '@/api'

export const getMenteeList = () => {
  return api.get('/mentors/mentees')
}

export const getMemo = (menteeId) => {
  return api.get(`/members/${menteeId}/memo`)
}

export const saveMemo = (menteeId, memo) => {
  return api.put(`/members/${menteeId}/memo`, { memo })
}
