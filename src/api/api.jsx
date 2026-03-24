import axios from "axios";

const API = axios.create({
  baseURL: "https://adaptive-quiz-api-service-759082157852.asia-south1.run.app/api/v1",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

export default API;
