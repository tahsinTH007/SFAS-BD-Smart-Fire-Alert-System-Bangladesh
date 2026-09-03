import { axiosClient } from "@/lib/axiosClient";
import type {
  AnalyticsSummary,
  DispatchRecord,
  DispatchStatus,
  Envelope,
  Unit,
  UnitStats,
} from "./types";

export const unitApi = {
  list: async (params: Record<string, unknown> = {}): Promise<Unit[]> =>
    (await axiosClient.get<Envelope<Unit[]>>("/units", { params })).data.data,

  get: async (id: string): Promise<Unit> =>
    (await axiosClient.get<Envelope<Unit>>(`/units/${id}`)).data.data,

  stats: async (stationId?: string): Promise<UnitStats> =>
    (
      await axiosClient.get<Envelope<UnitStats>>("/units/stats", {
        params: { stationId },
      })
    ).data.data,

  create: async (body: Record<string, unknown>): Promise<Unit> =>
    (await axiosClient.post<Envelope<Unit>>("/units", body)).data.data,

  update: async (id: string, body: Record<string, unknown>): Promise<Unit> =>
    (await axiosClient.patch<Envelope<Unit>>(`/units/${id}`, body)).data.data,

  remove: async (id: string): Promise<void> => {
    await axiosClient.delete(`/units/${id}`);
  },

  setStatus: async (
    id: string,
    status: string,
    note?: string,
  ): Promise<Unit> =>
    (
      await axiosClient.patch<Envelope<Unit>>(`/units/${id}/status`, {
        status,
        note,
      })
    ).data.data,

  // ── Crew ──────────────────────────────────────────────────────────────────
  addCrew: async (id: string, member: Record<string, unknown>): Promise<Unit> =>
    (await axiosClient.post<Envelope<Unit>>(`/units/${id}/crew`, member)).data
      .data,

  updateCrew: async (
    id: string,
    crewId: string,
    updates: Record<string, unknown>,
  ): Promise<Unit> =>
    (
      await axiosClient.patch<Envelope<Unit>>(
        `/units/${id}/crew/${crewId}`,
        updates,
      )
    ).data.data,

  removeCrew: async (id: string, crewId: string): Promise<Unit> =>
    (await axiosClient.delete<Envelope<Unit>>(`/units/${id}/crew/${crewId}`))
      .data.data,

  // ── Dispatch ──────────────────────────────────────────────────────────────
  recommend: async (alertId: string, stationId?: string): Promise<Unit[]> =>
    (
      await axiosClient.get<Envelope<Unit[]>>(
        `/alerts/${alertId}/units/recommend`,
        { params: { stationId } },
      )
    ).data.data,

  dispatch: async (
    alertId: string,
    unitIds: string[],
    operator: string,
  ): Promise<DispatchRecord[]> =>
    (
      await axiosClient.post<Envelope<DispatchRecord[]>>(
        `/alerts/${alertId}/dispatch`,
        { unitIds, operator },
      )
    ).data.data,

  dispatchesForAlert: async (alertId: string): Promise<DispatchRecord[]> =>
    (
      await axiosClient.get<Envelope<DispatchRecord[]>>(
        `/alerts/${alertId}/dispatches`,
      )
    ).data.data,

  activeDispatches: async (stationId?: string): Promise<DispatchRecord[]> =>
    (
      await axiosClient.get<Envelope<DispatchRecord[]>>(
        "/units/dispatches/active",
        { params: { stationId } },
      )
    ).data.data,

  setDispatchStatus: async (
    dispatchId: string,
    status: DispatchStatus,
    note?: string,
  ): Promise<DispatchRecord> =>
    (
      await axiosClient.patch<Envelope<DispatchRecord>>(
        `/units/dispatches/${dispatchId}/status`,
        { status, note },
      )
    ).data.data,
};

export const analyticsApi = {
  summary: async (stationId?: string, days = 30): Promise<AnalyticsSummary> =>
    (
      await axiosClient.get<Envelope<AnalyticsSummary>>("/analytics/summary", {
        params: { stationId, days },
      })
    ).data.data,
};
