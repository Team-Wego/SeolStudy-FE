import api from "@/api";

export const getMenteeList = () => {
    return api.get("/mentors/mentees");
};

export const getDashboardSummary = () => {
    return api.get("/mentors/summary");
};

export const getPendingFeedbacks = () => {
    return api.get("/mentors/submissions/pending-feedback");
};

export const getMenteeProgress = () => {
    return api.get("/mentors/mentees/submission-summary");
};

export const getMemo = (menteeId) => {
    return api.get(`/members/${menteeId}/memo`);
};

export const saveMemo = (menteeId, memo) => {
    return api.put(`/members/${menteeId}/memo`, { memo });
};
