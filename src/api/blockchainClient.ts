import axios from "axios";

const createApiClient = (baseURL: string) => {
  return axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
  });
};

export const blockchainApi = createApiClient("https://qcc-backend.com");