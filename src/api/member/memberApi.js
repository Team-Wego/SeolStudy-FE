import api from "@/api";

export function getMember(memberId) {
    return api.get(`/members/${memberId}`);
}

export function updateMember(data, file) {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (file) {
        formData.append('file', file);
    }
    return api.put('/members', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}

export function getStudyStatus(menteeId, startDate, endDate, taskType) {
    return api.get(`/mentees/${menteeId}/study-status`, {
        params: { startDate, endDate, taskType },
    });
}
