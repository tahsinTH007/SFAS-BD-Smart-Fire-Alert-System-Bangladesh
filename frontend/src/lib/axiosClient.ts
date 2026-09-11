import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
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

/**
 * Retry idempotent requests across a backend cold start.
 *
 * On a free hosting tier the API process is put to sleep after a period of
 * inactivity and takes 30–60 s to come back on the next request. Without this,
 * every panel on the first page load fails at once and the operator is left
 * to refresh by hand. GETs are safe to repeat, so they back off and retry
 * while the host wakes; anything that writes is never replayed.
 */
const RETRY_DELAYS_MS = [2_000, 4_000, 8_000, 15_000, 15_000];

type RetriableConfig = InternalAxiosRequestConfig & { __retryCount?: number };

function isColdStartError(err: AxiosError): boolean {
  if (err.code === "ECONNABORTED" || err.code === "ERR_NETWORK") return true;
  if (!err.response) return true;
  return [502, 503, 504].includes(err.response.status);
}

axiosClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const config = err.config as RetriableConfig | undefined;
    const method = (config?.method ?? "get").toLowerCase();

    if (!config || method !== "get" || !isColdStartError(err)) {
      return Promise.reject(err);
    }

    const attempt = config.__retryCount ?? 0;
    if (attempt >= RETRY_DELAYS_MS.length) return Promise.reject(err);

    config.__retryCount = attempt + 1;
    await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
    return axiosClient.request(config);
  },
);
