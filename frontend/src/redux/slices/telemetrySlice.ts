import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { deviceApi } from "@/api/systemApi";
import { toApiError } from "@/lib/axiosClient";
import type { DeviceStats, ReadingPoint, TelemetryDevice } from "@/api/types";
import type { RootState } from "../store";

/** A reading pushed over the socket. */
export interface LiveReading {
  deviceCode: string;
  temperature: number;
  humidity: number;
  smoke: number;
  gas: number;
  flame: number;
  riskScore: number;
  riskFactors: string[];
  priority: "critical" | "important" | "info";
  kind: string;
  summary: string;
  recordedAt: string;
}

const HISTORY_LIMIT = 40;

export const fetchTelemetry = createAsyncThunk<
  TelemetryDevice[],
  void,
  { rejectValue: string; state: RootState }
>("telemetry/fetch", async (_, { rejectWithValue, getState }) => {
  try {
    return await deviceApi.telemetry(getState().session.stationId ?? undefined);
  } catch (err) {
    return rejectWithValue(toApiError(err).message);
  }
});

export const fetchDeviceStats = createAsyncThunk<
  DeviceStats,
  void,
  { rejectValue: string; state: RootState }
>("telemetry/stats", async (_, { rejectWithValue, getState }) => {
  try {
    return await deviceApi.stats(getState().session.stationId ?? undefined);
  } catch (err) {
    return rejectWithValue(toApiError(err).message);
  }
});

export const seedHistory = createAsyncThunk<
  Record<string, ReadingPoint[]>,
  void,
  { rejectValue: string; state: RootState }
>("telemetry/seedHistory", async (_, { rejectWithValue, getState }) => {
  try {
    return await deviceApi.recentReadings(
      HISTORY_LIMIT,
      getState().session.stationId ?? undefined,
    );
  } catch (err) {
    return rejectWithValue(toApiError(err).message);
  }
});

interface TelemetryState {
  devices: TelemetryDevice[];
  stats: DeviceStats | null;
  /** Rolling per-device history, newest last, for sparklines. */
  history: Record<string, LiveReading[]>;
  loading: boolean;
  error: string | null;
  connected: boolean;
}

const initialState: TelemetryState = {
  devices: [],
  stats: null,
  history: {},
  loading: false,
  error: null,
  connected: false,
};

const telemetrySlice = createSlice({
  name: "telemetry",
  initialState,
  reducers: {
    readingReceived: (state, action: PayloadAction<LiveReading>) => {
      const r = action.payload;

      const list = state.history[r.deviceCode] ?? [];
      list.push(r);
      if (list.length > HISTORY_LIMIT) list.shift();
      state.history[r.deviceCode] = list;

      const device = state.devices.find((d) => d.deviceCode === r.deviceCode);
      if (device) {
        device.online = true;
        device.lastSeenAt = r.recordedAt;
        device.readings = {
          temperature: r.temperature,
          humidity: r.humidity,
          smoke: r.smoke,
          gas: r.gas,
          flame: r.flame,
          riskScore: r.riskScore,
          readAt: r.recordedAt,
        };
      }
    },

    socketStatusChanged: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchTelemetry.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTelemetry.fulfilled, (state, action) => {
        state.loading = false;
        state.devices = action.payload;
        state.error = null;
      })
      .addCase(fetchTelemetry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load telemetry";
      })
      .addCase(fetchDeviceStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // Prime the sparklines from stored readings so the cards show a trend on
      // first paint instead of waiting ~40s for live pushes to accumulate.
      .addCase(seedHistory.fulfilled, (state, action) => {
        for (const [deviceCode, readings] of Object.entries(action.payload)) {
          if (state.history[deviceCode]?.length) continue;
          state.history[deviceCode] = readings.map((r) => ({
            deviceCode,
            temperature: r.temperature,
            humidity: r.humidity,
            smoke: r.smoke,
            gas: r.gas,
            flame: r.flame,
            riskScore: r.riskScore,
            riskFactors: r.riskFactors ?? [],
            priority:
              r.riskScore >= 70
                ? "critical"
                : r.riskScore >= 40
                  ? "important"
                  : "info",
            kind: "",
            summary: "",
            recordedAt: r.recordedAt,
          }));
        }
      });
  },
});

export const { readingReceived, socketStatusChanged } = telemetrySlice.actions;
export default telemetrySlice.reducer;
