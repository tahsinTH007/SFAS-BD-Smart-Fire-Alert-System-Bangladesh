import { axiosClient } from "@/lib/axiosClient";
import { OPERATOR_NAME } from "@/lib/config";
import type {
  AlertResponse,
  AlertStats,
  Envelope,
  Pagination,
  TimeseriesPoint,
  TopDevice,
} from "./types";

export type { AlertResponse } from "./types";

export interface AlertListParams {
  page?: number;
  limit?: number;
  priority?: string;
  status?: string;
  search?: string;
  read?: boolean;
  acknowledged?: boolean;
  deviceId?: string;
  building?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function toQuery(params: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = String(v);
  }
  return out;
}

export const alertApi = {
  /** Flat list (no params) — used by the live map and notification views. */
  getAllAlerts: async (): Promise<AlertResponse[]> => {
    const res = await axiosClient.get<Envelope<AlertResponse[]>>("/alerts");
    return res.data.data;
  },

  /** Paginated + filtered list. */
  list: async (
    params: AlertListParams,
  ): Promise<{ alerts: AlertResponse[]; pagination: Pagination }> => {
    const res = await axiosClient.get<Envelope<AlertResponse[]>>("/alerts", {
      params: toQuery(params as Record<string, unknown>),
    });
    return {
      alerts: res.data.data,
      pagination:
        res.data.pagination ?? {
          total: res.data.data.length,
          page: 1,
          limit: res.data.data.length,
          pages: 1,
        },
    };
  },

  getSingleAlert: async (id: string): Promise<AlertResponse> => {
    const res = await axiosClient.get<Envelope<AlertResponse>>(`/alerts/${id}`);
    return res.data.data;
  },

  getAlertsByPriority: async (priority: string): Promise<AlertResponse[]> => {
    const res = await axiosClient.get<Envelope<AlertResponse[]>>(
      `/alerts/priority/${priority}`,
    );
    return res.data.data;
  },

  getRelated: async (id: string): Promise<AlertResponse[]> => {
    const res = await axiosClient.get<Envelope<AlertResponse[]>>(
      `/alerts/${id}/related`,
    );
    return res.data.data;
  },

  // ── Analytics ──────────────────────────────────────────────────────────────

  getStats: async (): Promise<AlertStats> => {
    const res = await axiosClient.get<Envelope<AlertStats>>("/alerts/stats");
    return res.data.data;
  },

  getTimeseries: async (hours = 24): Promise<TimeseriesPoint[]> => {
    const res = await axiosClient.get<Envelope<TimeseriesPoint[]>>(
      "/alerts/timeseries",
      { params: { hours } },
    );
    return res.data.data;
  },

  getTopDevices: async (limit = 5): Promise<TopDevice[]> => {
    const res = await axiosClient.get<Envelope<TopDevice[]>>(
      "/alerts/top-devices",
      { params: { limit } },
    );
    return res.data.data;
  },

  // ── Workflow ───────────────────────────────────────────────────────────────

  markRead: async (id: string, read = true): Promise<AlertResponse> => {
    const res = await axiosClient.patch<Envelope<AlertResponse>>(
      `/alerts/${id}/read`,
      { read },
    );
    return res.data.data;
  },

  acknowledge: async (
    id: string,
    operator = OPERATOR_NAME,
  ): Promise<AlertResponse> => {
    const res = await axiosClient.patch<Envelope<AlertResponse>>(
      `/alerts/${id}/acknowledge`,
      { operator },
    );
    return res.data.data;
  },

  resolve: async (
    id: string,
    note?: string,
    operator = OPERATOR_NAME,
  ): Promise<AlertResponse> => {
    const res = await axiosClient.patch<Envelope<AlertResponse>>(
      `/alerts/${id}/resolve`,
      { operator, note },
    );
    return res.data.data;
  },

  reopen: async (id: string): Promise<AlertResponse> => {
    const res = await axiosClient.patch<Envelope<AlertResponse>>(
      `/alerts/${id}/reopen`,
    );
    return res.data.data;
  },

  addComment: async (
    id: string,
    body: string,
    author = OPERATOR_NAME,
  ): Promise<AlertResponse> => {
    const res = await axiosClient.post<Envelope<AlertResponse>>(
      `/alerts/${id}/comments`,
      { author, body },
    );
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await axiosClient.delete(`/alerts/${id}`);
  },

  // ── Bulk ───────────────────────────────────────────────────────────────────

  bulkMarkRead: async (ids: string[], read = true): Promise<number> => {
    const res = await axiosClient.patch<{ modified: number }>(
      "/alerts/bulk/read",
      { ids, read },
    );
    return res.data.modified;
  },

  bulkAcknowledge: async (
    ids: string[],
    operator = OPERATOR_NAME,
  ): Promise<number> => {
    const res = await axiosClient.patch<{ modified: number }>(
      "/alerts/bulk/acknowledge",
      { ids, operator },
    );
    return res.data.modified;
  },

  bulkDelete: async (ids: string[]): Promise<number> => {
    const res = await axiosClient.post<{ deleted: number }>(
      "/alerts/bulk/delete",
      { ids },
    );
    return res.data.deleted;
  },
};
