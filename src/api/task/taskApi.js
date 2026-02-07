import api from "@/api";

export function getTaskDailyStatus(menteeId, startDate, endDate, taskType) {
    return api.get(`/mentees/${menteeId}/tasks/daily-status`, {
        params: { startDate, endDate, taskType },
    });
}
