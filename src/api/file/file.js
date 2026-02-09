import api from "@/api/index.js";

export const createPresignedGetUrl = (s3Url, fileName) => {
    return api.post("/files/presigned-get-url", { s3Url, fileName });
};
