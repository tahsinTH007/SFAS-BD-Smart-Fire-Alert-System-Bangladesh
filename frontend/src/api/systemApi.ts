import { axiosClient } from "@/lib/axiosClient";
import type {
  Building,
  BuildingStats,
  Device,
  DeviceStats,
  Envelope,
  HealthReport,
  Pagination,
  ReadingPoint,
  RiskAssessment,
  SerialStatus,
  Station,
  TelemetryDevice,
} from "./types";

interface ListResult<T> {
  items: T[];
  pagination: Pagination;
}

function unwrapList<T>(res: {
  data: Envelope<T[]>;
}): ListResult<T> {
  return {
    items: res.data.data,
    pagination:
      res.data.pagination ?? {
        total: res.data.data.length,
        page: 1,
        limit: res.data.data.length,
        pages: 1,
      },
  };
}

// ─── Devices ─────────────────────────────────────────────────────────────────

export const deviceApi = {
  list: async (params: Record<string, unknown> = {}): Promise<ListResult<Device>> =>
    unwrapList(await axiosClient.get<Envelope<Device[]>>("/devices", { params })),

  get: async (id: string): Promise<Device> =>
    (await axiosClient.get<Envelope<Device>>(`/devices/${id}`)).data.data,

  stats: async (): Promise<DeviceStats> =>
    (await axiosClient.get<Envelope<DeviceStats>>("/devices/stats")).data.data,

  telemetry: async (): Promise<TelemetryDevice[]> =>
    (await axiosClient.get<Envelope<TelemetryDevice[]>>("/devices/telemetry"))
      .data.data,

  readings: async (deviceCode: string, limit = 60): Promise<ReadingPoint[]> =>
    (
      await axiosClient.get<Envelope<ReadingPoint[]>>(
        `/devices/${encodeURIComponent(deviceCode)}/readings`,
        { params: { limit } },
      )
    ).data.data,

  create: async (
    body: Record<string, unknown>,
  ): Promise<{ device: Device; apiKey: string }> => {
    const res = await axiosClient.post<Envelope<Device> & { apiKey: string }>(
      "/devices",
      body,
    );
    return { device: res.data.data, apiKey: res.data.apiKey };
  },

  update: async (id: string, body: Record<string, unknown>): Promise<Device> =>
    (await axiosClient.patch<Envelope<Device>>(`/devices/${id}`, body)).data.data,

  remove: async (id: string): Promise<void> => {
    await axiosClient.delete(`/devices/${id}`);
  },
};

// ─── Buildings ───────────────────────────────────────────────────────────────

export const buildingApi = {
  list: async (
    params: Record<string, unknown> = {},
  ): Promise<ListResult<Building>> =>
    unwrapList(
      await axiosClient.get<Envelope<Building[]>>("/buildings", { params }),
    ),

  get: async (id: string): Promise<Building> =>
    (await axiosClient.get<Envelope<Building>>(`/buildings/${id}`)).data.data,

  stats: async (): Promise<BuildingStats> =>
    (await axiosClient.get<Envelope<BuildingStats>>("/buildings/stats")).data
      .data,

  create: async (body: Record<string, unknown>): Promise<Building> =>
    (await axiosClient.post<Envelope<Building>>("/buildings", body)).data.data,

  update: async (id: string, body: Record<string, unknown>): Promise<Building> =>
    (await axiosClient.patch<Envelope<Building>>(`/buildings/${id}`, body)).data
      .data,

  remove: async (id: string): Promise<void> => {
    await axiosClient.delete(`/buildings/${id}`);
  },
};

// ─── Stations ────────────────────────────────────────────────────────────────

export const stationApi = {
  list: async (
    params: Record<string, unknown> = {},
  ): Promise<ListResult<Station>> =>
    unwrapList(
      await axiosClient.get<Envelope<Station[]>>("/stations", { params }),
    ),

  create: async (body: Record<string, unknown>): Promise<Station> =>
    (await axiosClient.post<Envelope<Station>>("/stations", body)).data.data,

  update: async (id: string, body: Record<string, unknown>): Promise<Station> =>
    (await axiosClient.patch<Envelope<Station>>(`/stations/${id}`, body)).data
      .data,

  remove: async (id: string): Promise<void> => {
    await axiosClient.delete(`/stations/${id}`);
  },
};

// ─── Sensors / system ────────────────────────────────────────────────────────

export const sensorApi = {
  evaluate: async (
    body: Record<string, unknown>,
  ): Promise<RiskAssessment> =>
    (await axiosClient.post<Envelope<RiskAssessment>>("/sensors/evaluate", body))
      .data.data,

  submitReading: async (body: Record<string, unknown>) =>
    (await axiosClient.post<Envelope<unknown>>("/sensors/readings", body)).data,

  serialStatus: async (): Promise<SerialStatus> =>
    (await axiosClient.get<Envelope<SerialStatus>>("/sensors/serial-status"))
      .data.data,
};

export const systemApi = {
  health: async (): Promise<HealthReport> =>
    (await axiosClient.get<HealthReport>("/health/ready")).data,
};
