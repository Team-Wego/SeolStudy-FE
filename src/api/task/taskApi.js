import api from "@/api";

export function getTaskDailyStatus(menteeId, startDate, endDate, taskType) {
    return api.get(`/mentees/${menteeId}/tasks/daily-status`, {
        params: { startDate, endDate, taskType },
    });
}

export function getTasks(menteeId, startDate, endDate, taskType) {
    return api.get(`/mentees/${menteeId}/tasks`, {
        params: { startDate, endDate, taskType },
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

export function createStudyTime(menteeId, data) {
    return api.post(`/mentees/${menteeId}/study-times`, data);
}

export function getDailyStudyTimes(menteeId, date) {
    return api.get(`/mentees/${menteeId}/planner/study-time`, {
        params: { date },
    });
}

export function getPlannerComment(menteeId, date) {
    return api.get(`/mentees/${menteeId}/planner/comments`, {
        params: { date },
    });
}

export function getStudyTime(menteeId, date) {
    return api.get(`/mentees/${menteeId}/planner/study-time`, {
        params: { date },
    });
}

export function updateTaskStatus(menteeId, taskId, isChecked) {
    return api.put(`/mentees/${menteeId}/tasks/${taskId}/status`, {
        isChecked,
    });
}

export function createPlannerComment(menteeId, data) {
    return api.post(`/mentees/${menteeId}/planner-comments`, data);
}

export function updatePlannerComment(menteeId, plannerId, data) {
    return api.put(`/mentees/${menteeId}/planner-comments/${plannerId}`, data);
}

export function deletePlannerComment(menteeId, plannerId) {
    return api.delete(`/mentees/${menteeId}/planner-comments/${plannerId}`);
}

export function completePlanner(menteeId, plannerId) {
    return api.patch(`/mentees/${menteeId}/planner-comments/${plannerId}/complete`);
}

export function getTaskDetail(taskId) {
    return api.get(`/tasks/${taskId}`);
}

export function updateTaskComment(menteeId, taskId, comment) {
    return api.put(`/mentees/${menteeId}/tasks/${taskId}/comment`, { comment });
}

export function uploadTaskImages(menteeId, taskId, files) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return api.post(`/mentees/${menteeId}/tasks/${taskId}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
}
