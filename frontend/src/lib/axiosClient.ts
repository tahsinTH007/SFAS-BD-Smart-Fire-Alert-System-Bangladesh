import axios, { AxiosError } from "axios";
import { API_BASE_URL } from "./config";

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

export interface ApiErrorShape {
  message: string;
  status: number;
  details?: { field: string; message: string }[];
}

/** Turns any thrown value into a message worth showing in a toast. */
export function toApiError(err: unknown): ApiErrorShape {
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError<{
      error?: { message?: string; status?: number; details?: unknown };
      message?: string;
    }>;

    if (e.code === "ECONNABORTED") {
      return { message: "Request timed out — is the API running?", status: 408 };
    }

    if (!e.response) {
      return {
        message:
          "Cannot reach the API. Check that the backend is running on " +
          API_BASE_URL,
        status: 0,
      };
    }

    const body = e.response.data;
    const details = Array.isArray(body?.error?.details)
      ? (body.error.details as { field: string; message: string }[])
      : undefined;

    return {
      message:
        body?.error?.message ??
        body?.message ??
        `Request failed with status ${e.response.status}`,
      status: e.response.status,
      details,
    };
  }

  if (err instanceof Error) return { message: err.message, status: 0 };
  return { message: "Unexpected error", status: 0 };
}

axiosClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err),
);
