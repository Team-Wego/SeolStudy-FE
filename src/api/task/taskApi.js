import api from "@/api";

export function getTaskDailyStatus(menteeId, startDate, endDate, taskType) {
    return api.get(`/mentees/${menteeId}/tasks/daily-status`, {
        params: { startDate, endDate, taskType },
    });
}

export function getTasks(menteeId, startDate, endDate) {
    return api.get(`/mentees/${menteeId}/tasks`, {
        params: { startDate, endDate },
    });
}

export function getGoals(menteeId, createdBy = "ALL") {
    return api.get("/goals", {
        params: { menteeId, createdBy },
    });
}

export function getWorksheetFiles(menteeId, keyword, subject) {
    const params = { menteeId };
    if (keyword) params.keyword = keyword;
    if (subject) params.subject = subject;
    return api.get(`/mentees/${menteeId}/worksheets`, { params });
}

export function createTask(menteeId, data) {
    return api.post(`/mentees/${menteeId}/tasks`, data);
}

export function getDailyTasks(menteeId, date) {
    return api.get(`/mentees/${menteeId}/planner/tasks`, { params: { date } });
}

export function getWeeklyTasks(menteeId, startDate, endDate) {
    return api.get(`/mentees/${menteeId}/tasks`, {
        params: { startDate, endDate },
    });
}
