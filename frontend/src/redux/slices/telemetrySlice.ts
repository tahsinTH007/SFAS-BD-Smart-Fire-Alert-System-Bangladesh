import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { deviceApi } from "@/api/systemApi";
import { toApiError } from "@/lib/axiosClient";
import type { DeviceStats, TelemetryDevice } from "@/api/types";

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
  { rejectValue: string }
>("telemetry/fetch", async (_, { rejectWithValue }) => {
  try {
    return await deviceApi.telemetry();
  } catch (err) {
    return rejectWithValue(toApiError(err).message);
  }
});

export const fetchDeviceStats = createAsyncThunk<
  DeviceStats,
  void,
  { rejectValue: string }
>("telemetry/stats", async (_, { rejectWithValue }) => {
  try {
    return await deviceApi.stats();
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
      });
  },
});

export const { readingReceived, socketStatusChanged } = telemetrySlice.actions;
export default telemetrySlice.reducer;
