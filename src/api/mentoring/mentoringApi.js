import api from '@/api'

export const getMenteeList = () => {
  return api.get('/mentors/mentees')
}
