import api from "@/api";

export const getWorksheets = (menteeId, keyword, subject) => {
    return api.get(`/mentees/${menteeId}/worksheets`, {
        params: { menteeId, keyword, subject },
    });
};
