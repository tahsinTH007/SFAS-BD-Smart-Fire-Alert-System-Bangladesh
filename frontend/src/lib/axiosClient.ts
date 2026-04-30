import axios from "axios";

export const axiosClient = axios.create({
  baseURL: process.env.PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});
