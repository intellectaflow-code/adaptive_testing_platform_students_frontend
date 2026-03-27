import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api/v1",
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
