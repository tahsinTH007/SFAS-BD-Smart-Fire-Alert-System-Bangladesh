import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { alertApi } from "@/api/alertApi";
import { toApiError } from "@/lib/axiosClient";
import type { AlertResponse, AlertStats } from "@/api/types";
import type { RootState } from "../store";

/**
 * Every mutation goes through the API and stores the server's response.
 *
 * The previous version dispatched plain reducers for acknowledge / markRead /
 * delete, so those changes lived only in memory and vanished on refresh.
 */

const asError = (err: unknown) => toApiError(err).message;

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchAlerts = createAsyncThunk<
  AlertResponse[],
  void,
  { rejectValue: string; state: RootState }
>("alerts/fetchAlerts", async (_, { rejectWithValue, getState }) => {
  try {
    // Every read is scoped to the station this console is deployed for.
    return await alertApi.getAllAlerts(getState().session.stationId ?? undefined);
  } catch (err) {
    return rejectWithValue(asError(err));
  }
});

export const fetchAlertById = createAsyncThunk<
  AlertResponse,
  string,
  { rejectValue: string }
>("alerts/fetchAlertById", async (id, { rejectWithValue }) => {
  try {
    return await alertApi.getSingleAlert(id);
  } catch (err) {
    return rejectWithValue(asError(err));
  }
});

export const fetchAlertsByPriority = createAsyncThunk<
  AlertResponse[],
  string,
  { rejectValue: string; state: RootState }
>("alerts/fetchAlertsByPriority", async (priority, { rejectWithValue, getState }) => {
  try {
    return await alertApi.getAlertsByPriority(
      priority,
      (getState() as RootState).session.stationId ?? undefined,
    );
  } catch (err) {
    return rejectWithValue(asError(err));
  }
});

export const fetchAlertStats = createAsyncThunk<
  AlertStats,
  void,
  { rejectValue: string; state: RootState }
>("alerts/fetchStats", async (_, { rejectWithValue, getState }) => {
  try {
    return await alertApi.getStats(getState().session.stationId ?? undefined);
  } catch (err) {
    return rejectWithValue(asError(err));
  }
});

export const markAlertRead = createAsyncThunk<
  AlertResponse,
  { id: string; read?: boolean },
  { rejectValue: string }
>("alerts/markRead", async ({ id, read = true }, { rejectWithValue }) => {
  try {
    return await alertApi.markRead(id, read);
  } catch (err) {
    return rejectWithValue(asError(err));
  }
});

export const acknowledgeAlert = createAsyncThunk<
  AlertResponse,
  string,
  { rejectValue: string; state: RootState }
>("alerts/acknowledge", async (id, { rejectWithValue, getState }) => {
  try {
    return await alertApi.acknowledge(
      id,
      (getState() as RootState).session.operator.name,
    );
  } catch (err) {
    return rejectWithValue(asError(err));
  }
});

export const resolveAlert = createAsyncThunk<
  AlertResponse,
  { id: string; note?: string },
  { rejectValue: string; state: RootState }
>("alerts/resolve", async ({ id, note }, { rejectWithValue, getState }) => {
  try {
    return await alertApi.resolve(
      id,
      note,
      (getState() as RootState).session.operator.name,
    );
  } catch (err) {
    return rejectWithValue(asError(err));
  }
});

export const reopenAlert = createAsyncThunk<
  AlertResponse,
  string,
  { rejectValue: string }
>("alerts/reopen", async (id, { rejectWithValue }) => {
  try {
    return await alertApi.reopen(id);
  } catch (err) {
    return rejectWithValue(asError(err));
  }
});

export const addAlertComment = createAsyncThunk<
  AlertResponse,
  { id: string; body: string },
  { rejectValue: string; state: RootState }
>("alerts/addComment", async ({ id, body }, { rejectWithValue, getState }) => {
  try {
    return await alertApi.addComment(
      id,
      body,
      (getState() as RootState).session.operator.name,
    );
  } catch (err) {
    return rejectWithValue(asError(err));
  }
});

export const removeAlert = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("alerts/remove", async (id, { rejectWithValue }) => {
  try {
    await alertApi.remove(id);
    return id;
  } catch (err) {
    return rejectWithValue(asError(err));
  }
});

export const bulkMarkRead = createAsyncThunk<
  string[],
  string[],
  { rejectValue: string }
>("alerts/bulkMarkRead", async (ids, { rejectWithValue }) => {
  try {
    await alertApi.bulkMarkRead(ids, true);
    return ids;
  } catch (err) {
    return rejectWithValue(asError(err));
  }
});

export const bulkAcknowledge = createAsyncThunk<
  string[],
  string[],
  { rejectValue: string }
>("alerts/bulkAcknowledge", async (ids, { rejectWithValue, getState }) => {
  try {
    await alertApi.bulkAcknowledge(
      ids,
      (getState() as RootState).session.operator.name,
    );
    return ids;
  } catch (err) {
    return rejectWithValue(asError(err));
  }
});

export const bulkRemove = createAsyncThunk<
  string[],
  string[],
  { rejectValue: string }
>("alerts/bulkRemove", async (ids, { rejectWithValue }) => {
  try {
    await alertApi.bulkDelete(ids);
    return ids;
  } catch (err) {
    return rejectWithValue(asError(err));
  }
});

// ─── State ────────────────────────────────────────────────────────────────────

interface AlertState {
  alerts: AlertResponse[];
  selectedAlert: AlertResponse | null;
  stats: AlertStats | null;
  loading: boolean;
  detailLoading: boolean;
  mutating: boolean;
  error: string | null;
  lastSyncedAt: string | null;
  /**
   * Alerts that arrived over the socket while this console was open.
   * Only these (plus genuinely recent ones) earn a full-screen takeover — a
   * backlog of old unacknowledged alerts must not blockade the screen on load.
   */
  liveIds: string[];
}

const initialState: AlertState = {
  alerts: [],
  selectedAlert: null,
  stats: null,
  loading: false,
  detailLoading: false,
  mutating: false,
  error: null,
  lastSyncedAt: null,
  liveIds: [],
};

function upsert(state: AlertState, alert: AlertResponse) {
  const i = state.alerts.findIndex((a) => a.id === alert.id);
  if (i === -1) state.alerts.unshift(alert);
  else state.alerts[i] = alert;

  if (state.selectedAlert?.id === alert.id) state.selectedAlert = alert;
}

const alertSlice = createSlice({
  name: "alerts",
  initialState,
  reducers: {
    /** Socket push: a brand new alert arrived. */
    alertReceived: (state, action: PayloadAction<AlertResponse>) => {
      if (!state.alerts.some((a) => a.id === action.payload.id)) {
        state.alerts.unshift(action.payload);
      }
      if (!state.liveIds.includes(action.payload.id)) {
        state.liveIds.push(action.payload.id);
        // Bounded — this only feeds the banner's "arrived just now" check.
        if (state.liveIds.length > 100) state.liveIds.shift();
      }
    },
    /** Socket push: an alert changed elsewhere. */
    alertUpdated: (state, action: PayloadAction<AlertResponse>) => {
      upsert(state, action.payload);
    },
    /** Socket push: an alert was deleted elsewhere. */
    alertRemoved: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter((a) => a.id !== action.payload);
      if (state.selectedAlert?.id === action.payload) {
        state.selectedAlert = null;
      }
    },
    clearSelectedAlert: (state) => {
      state.selectedAlert = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload;
        state.lastSyncedAt = new Date().toISOString();
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch alerts";
      });

    builder
      .addCase(fetchAlertById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchAlertById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedAlert = action.payload;
        upsert(state, action.payload);
      })
      .addCase(fetchAlertById.rejected, (state, action) => {
        state.detailLoading = false;
        state.selectedAlert = null;
        state.error = action.payload ?? "Failed to fetch alert";
      });

    builder
      .addCase(fetchAlertsByPriority.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload;
      })
      .addCase(fetchAlertStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });

    // Every single-alert mutation stores the server's returned document.
    for (const thunk of [
      markAlertRead,
      acknowledgeAlert,
      resolveAlert,
      reopenAlert,
      addAlertComment,
    ]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.mutating = true;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.mutating = false;
          upsert(state, action.payload as AlertResponse);
        })
        .addCase(thunk.rejected, (state, action) => {
          state.mutating = false;
          state.error = (action.payload as string) ?? "Action failed";
        });
    }

    builder.addCase(removeAlert.fulfilled, (state, action) => {
      state.alerts = state.alerts.filter((a) => a.id !== action.payload);
      if (state.selectedAlert?.id === action.payload) {
        state.selectedAlert = null;
      }
    });

    builder
      .addCase(bulkMarkRead.fulfilled, (state, action) => {
        const ids = new Set(action.payload);
        state.alerts.forEach((a) => {
          if (ids.has(a.id)) a.read = true;
        });
      })
      .addCase(bulkAcknowledge.fulfilled, (state, action) => {
        const ids = new Set(action.payload);
        state.alerts.forEach((a) => {
          if (ids.has(a.id)) {
            a.acknowledged = true;
            a.read = true;
            a.status = "acknowledged";
          }
        });
      })
      .addCase(bulkRemove.fulfilled, (state, action) => {
        const ids = new Set(action.payload);
        state.alerts = state.alerts.filter((a) => !ids.has(a.id));
      });
  },
});

export const {
  alertReceived,
  alertUpdated,
  alertRemoved,
  clearSelectedAlert,
  clearError,
} = alertSlice.actions;

export default alertSlice.reducer;
